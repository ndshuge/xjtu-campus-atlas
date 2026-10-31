import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {waitForWalkReady, measureWalkDisplacement, measurePostCancelDrift} from './qa-walk-settle.mjs';
const origin=process.argv[2]||'http://127.0.0.1:18906/';
const comparisonOrigin=process.argv.find(a=>a.startsWith('--compare='))?.slice('--compare='.length);
const out=path.resolve(process.argv[3]||'docs/quality-v2/canopy-r6');
const poses=(process.argv[4]||'avenue-east,north-wall').split(',');
const widths=(process.argv[5]||'1440,390').split(',').map(Number);
const dpr=Number(process.argv[6])||1;
const requestedHeight=Number(process.argv.find(a=>a.startsWith('--height='))?.slice(9))||0;
const interactionChecks=process.argv.includes('--interact');
const searchPlace=process.argv.find(a=>a.startsWith('--search-place='))?.slice('--search-place='.length);
const clickBuilding=process.argv.find(a=>a.startsWith('--building-click='))?.slice('--building-click='.length);
const longPressBuilding=process.argv.find(a=>a.startsWith('--building-long-press='))?.slice('--building-long-press='.length);
// Preserve independent interaction state: reusing one CDP target across sizes
// can retain synthetic pointer/OrbitControls state and produce false failures.
if(interactionChecks&&widths.length!==1)throw Error('Run --interact with one width per Edge process; use separate invocations for 390/430/768/desktop.');
await fs.mkdir(out,{recursive:true});
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'xjtu-r6-edge-'));
const edge=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
 '--headless=new','--no-first-run','--disable-extensions','--disable-background-networking',
 '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'
],{stdio:'ignore',windowsHide:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let socket;
let next=0;const pending=new Map(),errors=[],httpErrors=[];
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++next;const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},30000);pending.set(id,{resolve:r=>{clearTimeout(timer);resolve(r);},reject});socket.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.result?.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result?.result?.value;};
const results=[];
async function touch(type,points=[]){await send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y,id])=>({x,y,id,radiusX:3,radiusY:3}))});}
async function tap(selector){
 const p=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e?.getBoundingClientRect();return r&&r.width&&r.height?{x:r.x+r.width/2,y:r.y+r.height/2}:null})()`);
 if(!p){const debug=await evaluate('({width:innerWidth,mode:window.campusDiagnostics()?.mode,hudHidden:document.querySelector("#walk-hud")?.hidden,bodyClass:document.body.className})');throw Error('Touch target hidden: '+selector+' '+JSON.stringify(debug));}
 await touch('touchStart',[[p.x,p.y,1]]);await sleep(60);await touch('touchEnd');return p;
}
async function inspectMapChrome(){
 const ready=await evaluate('!document.querySelector("#map-more-btn")?.hidden && !document.querySelector("#map-search-launch")?.hidden');
 if(!ready)return {passed:false,reason:'Mobile menu or search launcher hidden'};
 await tap('#map-more-btn');await sleep(170);
 const menu=await evaluate('!document.querySelector("#map-extra").hidden && document.querySelector("#map-more-btn").getAttribute("aria-expanded")==="true"');
 await tap('#map-search-launch');await sleep(170);
 const search=await evaluate('document.activeElement?.id==="search" && !document.querySelector("#explorer").classList.contains("collapsed")');
 const closed=await evaluate('document.querySelector("#map-extra").hidden');
 return {passed:menu&&search&&closed,menu,search,closed};
}
async function inspectInteractions(){
 const initial=await evaluate('window.campusDiagnostics()');
 await touch('touchStart',[[160,320,1]]);
 for(let i=1;i<=12;i++){await touch('touchMove',[[160+i*5,320+i*3,1]]);await sleep(25);}await touch('touchEnd');await sleep(900);
 const pan=await evaluate('window.campusDiagnostics()');
 const distance=p=>Math.hypot(...p.camera.map((v,i)=>v-p.target[i]));
 await touch('touchStart',[[110,370,1],[270,370,2]]);
 for(let i=1;i<=12;i++){await touch('touchMove',[[110-i*3,370,1],[270+i*3,370,2]]);await sleep(25);}await touch('touchEnd');await sleep(1100);
 const pinch=await evaluate('window.campusDiagnostics()');
 const scale=await evaluate('visualViewport.scale');
 const labelSamples=[];
 for(let i=0;i<6;i++){labelSamples.push(await evaluate('[...document.querySelectorAll(".label")].filter(e=>!e.hidden).map(e=>({name:e.textContent,x:parseFloat(e.style.left),y:parseFloat(e.style.top)}))'));await sleep(100);}
 const labelDrift=Math.max(0,...labelSamples[0].map(a=>Math.max(0,...labelSamples.map(s=>s.find(b=>b.name===a.name)).filter(Boolean).map(b=>Math.hypot(a.x-b.x,a.y-b.y)))));
 await tap('#walk-btn');
 const walkBefore=await waitForWalkReady(()=>evaluate('window.campusDiagnostics()'),sleep);
 const p=await evaluate('(()=>{const r=document.querySelector("[data-move=forward]").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
 await touch('touchStart',[[p.x,p.y,1]]);await sleep(850);await touch('touchEnd');await sleep(150);
 const walkAfter=await evaluate('window.campusDiagnostics()');
 await touch('touchStart',[[p.x,p.y,1]]);await sleep(180);await touch('touchCancel');await sleep(100);
 const cancelBefore=await evaluate('window.campusDiagnostics()');await sleep(400);
 const cancelAfter=await evaluate('window.campusDiagnostics()');
 const cancelDriftMetres=measurePostCancelDrift(cancelBefore,cancelAfter);
 await tap('#exit-walk');await sleep(300);
 const panMetres=Math.hypot(...pan.target.map((v,i)=>v-initial.target[i]));
 const walkMotion=measureWalkDisplacement(walkBefore,walkAfter),walkMetres=walkMotion.metres;
 const result={panMetres,pinchDistanceBefore:distance(pan),pinchDistanceAfter:distance(pinch),pageScale:scale,labelSampleCount:labelSamples[0].length,labelDriftPx:labelDrift,walkMetres,walkFromSpawn:walkMotion.fromSpawn,walkEntrySettled:true,walkCameraBefore:walkBefore.camera,walkCameraAfter:walkAfter.camera,walkSpawn:walkBefore.walkStart,cancelDriftMetres,pointerCancelStable:cancelDriftMetres<.35,walkMode:walkAfter.mode,returnMode:(await evaluate('window.campusDiagnostics()')).mode};
 result.passed=panMetres>1&&distance(pinch)<distance(pan)*.98&&scale===1&&labelSamples.every(sample=>sample.length<=3)&&labelDrift<=2&&walkAfter.mode==='walk'&&walkMetres>1&&walkMetres<25&&result.pointerCancelStable&&result.returnMode==='orbit';
 return result;
}
async function mouseClick(selector){
 const p=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)})?.getBoundingClientRect();return r&&r.width&&r.height?{x:r.x+r.width/2,y:r.y+r.height/2}:null})()`);
 if(!p)throw Error('Mouse target hidden: '+selector);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});
}
async function inspectDesktopInteractions(){
 const initial=await evaluate('window.campusDiagnostics()');
 await send('Input.dispatchMouseEvent',{type:'mousePressed',x:800,y:390,button:'left',buttons:1,clickCount:1});
 for(let i=1;i<=12;i++){await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:800+i*6,y:390+i*2,button:'left',buttons:1});await sleep(20);}
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:872,y:414,button:'left',clickCount:1});await sleep(900);
 const rotated=await evaluate('window.campusDiagnostics()');
 await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:850,y:390,deltaX:0,deltaY:-240});await sleep(900);
 const zoomed=await evaluate('window.campusDiagnostics()'),distance=p=>Math.hypot(...p.camera.map((v,i)=>v-p.target[i]));
 await mouseClick('#layers-btn');await mouseClick('#toggle-trees');await sleep(400);
 const hidden=await evaluate('window.campusDiagnostics()');
 await mouseClick('#toggle-trees');await mouseClick('#layers-btn');
 await mouseClick('#search');await send('Input.insertText',{text:searchPlace||'钱学森'});await sleep(300);await mouseClick('#place-list button');await sleep(1700);
 const selected=await evaluate('window.campusDiagnostics()');
 const result={rotationMetres:Math.hypot(...rotated.camera.map((v,i)=>v-initial.camera[i])),distanceBeforeWheel:distance(rotated),distanceAfterWheel:distance(zoomed),treeLayerTrianglesBefore:zoomed.triangles,treeLayerTrianglesHidden:hidden.triangles,treeLayerDrawCallsBefore:zoomed.drawCalls,treeLayerDrawCallsHidden:hidden.drawCalls,selected:selected.selected};
 result.passed=result.rotationMetres>2&&distance(zoomed)<distance(rotated)*.98&&hidden.triangles<zoomed.triangles*.8&&selected.selected===(searchPlace||'钱学森图书馆');return result;
}
async function inspectViewOrb(width){
 const mobile=width<=768,state=()=>evaluate('window.campusDiagnostics()'),delta=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 const angle=(a,b)=>Math.hypot(a.viewAngles.yaw-b.viewAngles.yaw,a.viewAngles.pitch-b.viewAngles.pitch);
 const rect=await evaluate('(()=>{const r=document.querySelector("#view-orb").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height}})()');
 const snapshot=async name=>{const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(out,name+'-'+width+'.png'),Buffer.from(shot.result.data,'base64'));};
 const layout=await evaluate('(()=>{const box=e=>e.getBoundingClientRect(),a=box(document.querySelector("#view-navigation")),b=box(document.querySelector(".toolbar")),c=box(document.querySelector(".explorer")),link=document.querySelector(".attribution a"),d=box(link);const overlap=(x,y)=>x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top,hit=document.elementFromPoint(d.left+d.width/2,d.top+d.height/2);return {viewport:a.left>=0&&a.right<=innerWidth&&a.top>=0&&a.bottom<=innerHeight,toolbar:overlap(a,b),explorer:overlap(a,c),attributionToolbar:overlap(d,b),attributionVisible:d.left>=0&&d.right<=innerWidth&&d.top>=0&&d.bottom<=innerHeight&&(hit===link||link.contains(hit))}})()');
 const discoverability=await evaluate('(()=>{const h=document.querySelector(".view-navigation-heading"),r=h.getBoundingClientRect();return {text:h.textContent.trim(),visible:r.width>0&&r.height>0,resetVisible:document.querySelector("#view-reset").getBoundingClientRect().width>0}})()');
 const before=await state();
 if(mobile){await touch('touchStart',[[155,320,1]]);for(let i=1;i<=8;i++)await touch('touchMove',[[155+i*5,320+i*2,1]]);await touch('touchEnd');}
 else{await send('Input.dispatchMouseEvent',{type:'mousePressed',x:800,y:390,button:'left',buttons:1,clickCount:1});for(let i=1;i<=8;i++)await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:800+i*5,y:390+i*2,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:840,y:406,button:'left',clickCount:1});}
 await sleep(900);const panned=await state();
 const x=rect.x,y=rect.y+8;
 if(!mobile){await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y,button:'none'});await sleep(300);await snapshot('orb-hover');}
 if(mobile){await touch('touchStart',[[x,y,1]]);}
 else await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1});
 const pressed=await state(),gridBefore=await evaluate('document.querySelector("#orb-grid").style.transform');
 const held=await evaluate('document.querySelector("#view-navigation").classList.contains("is-active")');
 await sleep(120);const pressFeedback=await evaluate('(()=>{const e=document.querySelector(".orb-surface"),r=document.querySelector("#view-orb").getBoundingClientRect();return {scale:Number(e.style.getPropertyValue("--orb-press")||1),width:r.width}})()');
 await snapshot('orb-held');
 for(let i=1;i<=8;i++){if(mobile)await touch('touchMove',[[x+i*3,y-i*1.5,1]]);else await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:x+i*3,y:y-i*1.5,button:'left',buttons:1});if(i===4){await sleep(80);await snapshot('orb-drag');}}
 if(mobile)await touch('touchEnd');else await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:x+24,y:y-12,button:'left',clickCount:1});
 await sleep(500);const releaseFeedback=await evaluate('Number(document.querySelector(".orb-surface").style.getPropertyValue("--orb-press")||1)');await sleep(400);const looked=await state(),released=await evaluate('!document.querySelector("#view-navigation").classList.contains("is-active")');
 const gridAfter=await evaluate('document.querySelector("#orb-grid").style.transform');await snapshot('orb-released');
 // A short flick should coast at a fixed position; pressing north must interrupt it.
 if(mobile)await touch('touchStart',[[x,y,1]]);else await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1});
 for(let i=1;i<=6;i++){if(mobile)await touch('touchMove',[[x+i*3,y,1]]);else await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:x+i*3,y,button:'left',buttons:1});await sleep(20);}
 if(mobile)await touch('touchEnd');else await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:x+18,y,button:'left',clickCount:1});
 await sleep(30);const coastStart=await state();await sleep(150);const coastEnd=await state();
 if(mobile)await tap('#north-btn');else await mouseClick('#north-btn');await sleep(800);const coastInterrupted=await state();await sleep(220);const coastSettled=await state();
 let pinch=null;
 if(mobile){await touch('touchStart',[[x-10,y,1],[x+10,y,2]]);for(let i=1;i<=6;i++)await touch('touchMove',[[x-10-i*2,y,1],[x+10+i*2,y,2]]);await touch('touchEnd');await sleep(350);pinch=await state();}
 const atMin=await evaluate('document.querySelector("#zoom-in").disabled');if(atMin){if(mobile)await tap('#zoom-out');else await mouseClick('#zoom-out');await sleep(550);}
 const beforeZoom=await state();if(mobile)await tap('#zoom-in');else await mouseClick('#zoom-in');await sleep(550);const zoomed=await state();
 if(mobile)await tap('#north-btn');else await mouseClick('#north-btn');await sleep(850);const north=await state();
 await evaluate('document.querySelector("#view-orb").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await sleep(250);const keyboard=await state();
 if(mobile){await touch('touchStart',[[x,y,1]]);await touch('touchEnd');await sleep(110);await touch('touchStart',[[x,y,1]]);await touch('touchEnd');}
 else{for(const n of [1,2]){await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:n});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:n});}}
 await sleep(950);const reset=await state();
 let resetButton=null;
 if(!mobile){await evaluate('document.querySelector("#view-orb").focus()');await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowUp',code:'ArrowUp',windowsVirtualKeyCode:38});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowUp',code:'ArrowUp',windowsVirtualKeyCode:38});await sleep(150);const changed=await state();await mouseClick('#view-reset');await sleep(950);const restored=await state();resetButton={changed:angle(reset,changed),yaw:restored.viewAngles.yaw,pitch:restored.viewAngles.pitch,anchorDrift:delta(changed.camera,restored.camera)};}
 await snapshot('orb-reset');
 if(mobile){await touch('touchStart',[[x,y,1]]);await touch('touchCancel');}const cancel=await evaluate('!document.querySelector("#view-navigation").classList.contains("is-active")');
 if(mobile)await tap('#walk-btn');else await mouseClick('#walk-btn');await sleep(1400);const walkBefore=await state();
 const walkRect=await evaluate('(()=>{const r=document.querySelector("#view-orb").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2+8}})()');
 if(mobile){await touch('touchStart',[[walkRect.x,walkRect.y,1]]);for(let i=1;i<=8;i++)await touch('touchMove',[[walkRect.x+i*3,walkRect.y-i,1]]);await touch('touchEnd');}
 else{await send('Input.dispatchMouseEvent',{type:'mousePressed',...walkRect,button:'left',buttons:1,clickCount:1});for(let i=1;i<=8;i++)await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:walkRect.x+i*3,y:walkRect.y-i,button:'left',buttons:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:walkRect.x+24,y:walkRect.y-8,button:'left',clickCount:1});}
 await sleep(400);const walkAfter=await state();if(mobile)await tap('#exit-walk');else await mouseClick('#exit-walk');await sleep(350);const walkReturn=await state();
 const result={layout,discoverability,size:rect.w,pressFeedback,releaseFeedback,gridSynced:gridBefore!==gridAfter,resetButton,held,released,cancel,minimumDisabled:!pinch||pinch.fieldOfView>20.01||atMin,mapPan:delta(before.camera,panned.camera),mapAngleChange:angle(before,panned),residualPanBeforePress:delta(panned.camera,pressed.camera),lookAnchorDrift:delta(pressed.camera,looked.camera),lookAngleChange:angle(pressed,looked),pinch:pinch&&{before:looked.fieldOfView,after:pinch.fieldOfView,anchorDrift:delta(looked.camera,pinch.camera),pageScale:await evaluate('visualViewport.scale')},zoom:{before:beforeZoom.fieldOfView,after:zoomed.fieldOfView,anchorDrift:delta(beforeZoom.camera,zoomed.camera)},north:{yaw:north.viewAngles.yaw,pitchDelta:Math.abs(north.viewAngles.pitch-zoomed.viewAngles.pitch),anchorDrift:delta(zoomed.camera,north.camera)},keyboard:{angleChange:angle(north,keyboard),anchorDrift:delta(north.camera,keyboard.camera)},reset:{yaw:reset.viewAngles.yaw,pitch:reset.viewAngles.pitch,fov:reset.fieldOfView,anchorDrift:delta(keyboard.camera,reset.camera)}};
 result.inertia={reducedMotion:before.reducedMotion,angleChange:angle(coastStart,coastEnd),anchorDrift:delta(coastStart.camera,coastEnd.camera),interruptedYaw:coastInterrupted.viewAngles.yaw,settledDrift:angle(coastInterrupted,coastSettled)};
 result.walk={mode:walkAfter.mode,angleChange:angle(walkBefore,walkAfter),anchorDrift:delta(walkBefore.camera,walkAfter.camera),returnMode:walkReturn.mode};
 result.passed=layout.viewport&&!layout.toolbar&&!layout.explorer&&!layout.attributionToolbar&&layout.attributionVisible&&(mobile?rect.w>=68&&rect.w<=84:rect.w>=128&&rect.w<=144&&discoverability.visible&&discoverability.resetVisible&&discoverability.text.includes('3D 视角')&&discoverability.text.includes('拖动旋转视角'))&&pressFeedback.scale<.99&&Math.abs(pressFeedback.width-rect.w)<.1&&releaseFeedback>.995&&result.gridSynced&&(!resetButton||(resetButton.changed>.04&&Math.abs(resetButton.yaw-.52)<.03&&Math.abs(resetButton.pitch+.70)<.03&&resetButton.anchorDrift<.01))&&held&&released&&cancel&&result.minimumDisabled&&result.mapPan>1&&result.mapAngleChange<.015&&result.lookAnchorDrift<.01&&result.lookAngleChange>.05&&(result.inertia.reducedMotion?result.inertia.angleChange<.005:result.inertia.angleChange>.01)&&result.inertia.anchorDrift<.01&&Math.abs(result.inertia.interruptedYaw)<.03&&result.inertia.settledDrift<.01&&(!pinch||(result.pinch.after<result.pinch.before*.9&&result.pinch.anchorDrift<.01&&result.pinch.pageScale===1))&&result.zoom.after<result.zoom.before*.9&&result.zoom.anchorDrift<.01&&Math.abs(result.north.yaw)<.03&&result.north.pitchDelta<.03&&result.north.anchorDrift<.01&&result.keyboard.angleChange>.04&&result.keyboard.anchorDrift<.01&&Math.abs(result.reset.yaw-.52)<.03&&Math.abs(result.reset.pitch+.70)<.03&&Math.abs(result.reset.fov-39)<.1&&result.reset.anchorDrift<.01&&result.walk.mode==='walk'&&result.walk.angleChange>.05&&result.walk.anchorDrift<.01&&result.walk.returnMode==='orbit';
 return result;
}
async function inspectOwnedClick(id,width,hold=false){
 const point=await evaluate(`(()=>{const w=window.__r12World;if(!w)return null;const b=w.data.buildings.find(b=>b.id===${JSON.stringify(id)});if(!b)return null;
  const xs=b.points.map(p=>p[0]),zs=b.points.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs),cx=(x0+x1)/2,cz=(z0+z1)/2;
  for(const y of [.55,.75,.3].map(f=>1.1+(b.displayHeight||b.height)*f))for(const [x,z] of [[cx,z0],[cx,z1],[x0,cz],[x1,cz],[cx,cz]]){
   const v=w.controls.target.clone().set(x,y,z).project(w.camera),sx=(v.x+1)*innerWidth/2,sy=(1-v.y)*innerHeight/2;
   if(sx<15||sx>innerWidth-15||sy<70||sy>innerHeight-80)continue;w.pointer.set(v.x,v.y);w.ray.setFromCamera(w.pointer,w.camera);const hit=w.ray.intersectObjects(w.pickables,false)[0];
   if(hit&&w.hitPlace(hit)?.place?.id===b.id)return {x:sx,y:sy,name:b.name,id:b.id};
  }return null;})()`);
 if(!point)throw Error('No visible owned facade for actual click '+id);
 let selectedDuringHold=null;
 if(width<=768){await touch('touchStart',[[point.x,point.y,1]]);await sleep(hold?750:60);if(hold)selectedDuringHold=await evaluate('window.__r12World.selectedPlace?.id');await touch('touchEnd');}
 else {await send('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x,y:point.y,button:'left',clickCount:1});}
 await sleep(1700);const selectedId=await evaluate('window.__r12World.selectedPlace?.id');return {...point,kind:hold?'actual touch long press':width<=768?'actual touch tap':'actual mouse click',selectedDuringHold,selectedId,passed:selectedId===id&&(!hold||selectedDuringHold===id)};
}
async function inspectLibraryClick(){
 const p=await evaluate(`(()=>{const w=window.__libraryWorld;if(!w)return null;const v=w.controls.target.clone().set(-29.113,9,-75.5).project(w.camera);return {x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};})()`);
 if(!p||p.x<0||p.x>1440||p.y<0||p.y>900)throw Error('Library click target is outside viewport');
 await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});await sleep(1700);
 const selected=await evaluate('window.campusDiagnostics().selected');
 return {kind:'actual mesh click',...p,selected,passed:selected==='钱学森图书馆'};
}
try{
 let port;for(let i=0;i<80;i++){try{port=(await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{}await sleep(150);}
 if(!port)throw Error('Edge did not start');
 const tabs=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());
 socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
 socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m);}
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);
  if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push({console:m.params.args.map(a=>a.value||a.description).join(' ')});
  if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')errors.push(m.params.entry);
  if(m.method==='Network.responseReceived'&&m.params.response.status>=400)httpErrors.push({url:m.params.response.url,status:m.params.response.status});
 });
 await send('Page.enable');await send('Runtime.enable');await send('Log.enable');await send('Network.enable');
 if(process.argv.includes('--reduced-motion'))await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 if(process.argv.includes('--low-power-gpu'))await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,options,...rest){return get.call(this,type,/^webgl/.test(type)?{...options,powerPreference:'low-power'}:options,...rest);};})()`});
 for(const width of widths)for(const pose of poses){
  const start=Date.now(),errorStart=errors.length,httpStart=httpErrors.length,height=requestedHeight||(width<768?844:900);
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:dpr,mobile:width<=768});
  await send('Emulation.setTouchEmulationEnabled',{enabled:width<=768,maxTouchPoints:2});
  const url=new URL(pose==='compare'&&comparisonOrigin?comparisonOrigin:origin);url.searchParams.set('__qa_pose',pose+'-'+width);
  // Unlike hash-only navigation, a changed query creates a fresh document.
  if(pose==='home'||pose==='compare'){}else if(pose.startsWith('place:')||pose.startsWith('group:')){url.hash=pose.slice(6);if(pose.startsWith('group:'))url.searchParams.set('group','1');}else url.searchParams.set('inspection',pose==='north-wall-oblique'?'north-wall':pose);
  await send('Page.navigate',{url:'about:blank'});
  await send('Page.navigate',{url:url.href});
  let loaded=false;for(let i=0;i<160;i++){await sleep(200);loaded=await evaluate(`location.href===${JSON.stringify(url.href)} && typeof window.campusDiagnostics==='function' && !!window.__campusReady && document.querySelector("#loading").hidden`);if(loaded)break;}
  if(!loaded)throw Error('Scene did not become ready: '+url.href);
  await sleep(1800);
  if(pose==='north-wall-oblique'){
   const x=width*.6,y=height*.45,delta=width*.065;
   await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1});
   for(let i=1;i<=12;i++)await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:x+delta*i/12,y,button:'left',buttons:1});
   await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:x+delta,y,button:'left',clickCount:1});await sleep(900);
  }
  if(pose.startsWith('group:'))await sleep(1700);
  const frameSample=process.argv.includes('--measure-frames')?await evaluate(`new Promise(resolve=>{
   const times=[],before=window.campusDiagnostics().fps,startFrames=window.__libraryWorld?.frames;
   let done=false;const finish=timedOut=>{if(done)return;done=true;const elapsed=times.length>1?times.at(-1)-times[0]:0;resolve({reportedBefore:before,reportedAfter:window.campusDiagnostics().fps,freshFrames:Math.max(0,times.length-1),elapsedMs:elapsed,fps:elapsed?(times.length-1)*1000/elapsed:0,renderedFrames:startFrames===undefined?null:window.__libraryWorld.frames-startFrames,documentHidden:document.hidden,timedOut});};
   const tick=t=>{if(done)return;times.push(t);if(times.length>=121)finish(false);else requestAnimationFrame(tick);};requestAnimationFrame(tick);setTimeout(()=>finish(true),15000);
  })`):null;
  const runtime=await evaluate('window.campusDiagnostics()');
  if(pose.startsWith('group:')&&runtime.groupView?.name!==pose.slice(6))throw Error('Building group view mismatch: '+pose);
  if(pose.startsWith('place:')&&runtime.selected!==pose.slice(6))throw Error('Screenshot target mismatch: expected '+pose.slice(6)+', got '+runtime.selected);
  const metrics=await evaluate('({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,canvasWidth:document.querySelector("#scene canvas").width,overflow:document.documentElement.scrollWidth>innerWidth,script:document.querySelector("script[type=module]")?.src,scale:visualViewport.scale})');
  const gpu=await evaluate('(()=>{const g=document.querySelector("#scene canvas").getContext("webgl2"),e=g.getExtension("WEBGL_debug_renderer_info");return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER)})()');
  const file=pose.replace(/[^\p{L}\p{N}-]/gu,'_')+'-'+width+'.png';
  const png=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(out,file),Buffer.from(png.result.data,'base64'));
  const r={pose,url:url.href,width,height,file,elapsedMs:Date.now()-start,metrics,gpu,requestedPowerPreference:process.argv.includes('--low-power-gpu')?'low-power':'product default',runtime,frameSample,errors:errors.slice(errorStart),httpErrors:httpErrors.slice(httpStart)};
  if(process.argv.includes('--profile-layers')){
   r.layerProfile=await evaluate(`(async()=>{
    const checkbox=document.querySelector('#toggle-trees');
    if(!checkbox)return {error:'Tree-layer control unavailable'};
    const snap=()=>{const d=window.campusDiagnostics();return {drawCalls:d.drawCalls,triangles:d.triangles,geometries:d.geometries,textures:d.textures};};
    const frame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const before=snap();
    const was=checkbox.checked;let treesOff;try{checkbox.checked=false;checkbox.dispatchEvent(new Event('change',{bubbles:true}));await frame();treesOff=snap();}finally{checkbox.checked=was;checkbox.dispatchEvent(new Event('change',{bubbles:true}));await frame();}
    // Scene ownership stays private; only the existing tree-layer UI is toggled.
    return {before,treesOff,restored:snap(),note:'Tree visibility is a controlled A/B; library asset geometry is independently verified'};
   })()`);
   if(r.layerProfile.error)throw Error('Layer profile failed: '+JSON.stringify(r.layerProfile));
   console.log(JSON.stringify({layerProfile:r.layerProfile,pose,width}));
  }
  if(process.argv.includes('--detail-layout')&&pose.startsWith('place:')){
   r.detailLayout=await evaluate(`(()=>{const a=document.querySelector('#view-navigation').getBoundingClientRect(),b=document.querySelector('#detail').getBoundingClientRect(),c=document.querySelector('.toolbar').getBoundingClientRect();const overlap=(x,y)=>x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top;return {visible:a.width>0&&a.height>0,detailOverlap:overlap(a,b),toolbarOverlap:overlap(a,c),viewport:a.top>=0&&a.bottom<=innerHeight};})()`);
   if(!r.detailLayout.visible||r.detailLayout.detailOverlap||r.detailLayout.toolbarOverlap||!r.detailLayout.viewport)throw Error('Detail obscures view controls: '+JSON.stringify(r.detailLayout));
   if(width<=768){await tap('#detail-expand');await sleep(160);r.detailLayout.hiddenWhenExpanded=await evaluate('document.querySelector("#view-navigation").getBoundingClientRect().width===0');
    await tap('#detail-expand');await sleep(160);r.detailLayout.restored=await evaluate('document.querySelector("#view-navigation").getBoundingClientRect().width>0');
    if(!r.detailLayout.hiddenWhenExpanded||!r.detailLayout.restored)throw Error('Expanded detail does not restore view controls: '+JSON.stringify(r.detailLayout));}
   console.log(JSON.stringify({detailLayout:r.detailLayout}));
  }
  if(interactionChecks&&width<=768&&pose==='home'){
   r.interactions=await inspectInteractions();
   const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(out,'touch-after-'+width+'.png'),Buffer.from(shot.result.data,'base64'));
   r.errors=errors.slice(errorStart);r.httpErrors=httpErrors.slice(httpStart);console.log(JSON.stringify({interactions:r.interactions}));
  }
  if(process.argv.includes('--view-orb')&&pose==='home'){r.viewOrb=await inspectViewOrb(width);r.errors=errors.slice(errorStart);r.httpErrors=httpErrors.slice(httpStart);console.log(JSON.stringify({viewOrb:r.viewOrb}));if(!r.viewOrb.passed)throw Error('View orb interaction failed');}
  if(process.argv.includes('--r12-map-ui')&&width<=768&&pose==='home'){r.mapChrome=await inspectMapChrome();if(!r.mapChrome.passed)throw Error('Map Chrome check failed: '+JSON.stringify(r.mapChrome));}
  if(interactionChecks&&width>768&&pose==='home'){
   r.interactions=await inspectDesktopInteractions();
   const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(out,'desktop-after-'+width+'.png'),Buffer.from(shot.result.data,'base64'));
   r.errors=errors.slice(errorStart);r.httpErrors=httpErrors.slice(httpStart);console.log(JSON.stringify({desktopInteractions:r.interactions}));
  }
  if(process.argv.includes('--library-click')&&pose==='r11-south-front'&&width===1440){r.libraryClick=await inspectLibraryClick();if(!r.libraryClick.passed)throw Error('Actual library mesh click failed');}
  if(clickBuilding){r.buildingClick=await inspectOwnedClick(clickBuilding,width);r.errors=errors.slice(errorStart);r.httpErrors=httpErrors.slice(httpStart);if(!r.buildingClick.passed)throw Error('Actual building selection failed '+clickBuilding);console.log(JSON.stringify({buildingClick:r.buildingClick}));}
  if(longPressBuilding){if(width>768)throw Error('Long press check needs a touch viewport');r.buildingLongPress=await inspectOwnedClick(longPressBuilding,width,true);r.errors=errors.slice(errorStart);r.httpErrors=httpErrors.slice(httpStart);if(!r.buildingLongPress.passed)throw Error('Actual building long press failed '+longPressBuilding);console.log(JSON.stringify({buildingLongPress:r.buildingLongPress}));}
  results.push(r);console.log(JSON.stringify({pose,width,file,fps:runtime.fps,triangles:runtime.triangles,drawCalls:runtime.drawCalls,loadMs:runtime.sceneLoadMs,errors:r.errors.length,httpErrors:r.httpErrors.length}));
 }
 await fs.writeFile(path.join(out,'browser-results.json'),JSON.stringify({origin,testedAt:new Date().toISOString(),results,deviceCaveat:'Desktop Edge headless at CSS widths; not iPhone Safari hardware acceptance.'},null,2));
 if(results.some(r=>r.errors.length||r.httpErrors.length||r.metrics.overflow||r.runtime.contextLost||r.interactions?.passed===false))process.exitCode=1;
}finally{
 // On Windows Edge's launcher can exit while the isolated browser stays alive.
 // Close the browser over CDP before terminating the launcher, or repeated QA
 // runs accumulate GPU processes and invalidate performance measurements.
 try{if(socket?.readyState===WebSocket.OPEN){socket.send(JSON.stringify({id:++next,method:'Browser.close'}));await sleep(900);}}catch{}
 socket?.close();edge.kill();
}
