import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const origin=process.argv[2]||'http://127.0.0.1:18906/';
const out=path.resolve(process.argv[3]||'docs/quality-v2/canopy-r6');
const poses=(process.argv[4]||'avenue-east,north-wall').split(',');
const widths=(process.argv[5]||'1440,390').split(',').map(Number);
const dpr=Number(process.argv[6])||1;
const interactionChecks=process.argv.includes('--interact');
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
 if(!p)throw Error('Touch target hidden: '+selector);
 await touch('touchStart',[[p.x,p.y,1]]);await sleep(60);await touch('touchEnd');return p;
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
 await tap('#walk-btn');await sleep(400);const walkBefore=await evaluate('window.campusDiagnostics()');
 const p=await evaluate('(()=>{const r=document.querySelector("[data-move=forward]").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
 await touch('touchStart',[[p.x,p.y,1]]);await sleep(850);await touch('touchEnd');await sleep(150);
 const walkAfter=await evaluate('window.campusDiagnostics()');await tap('#exit-walk');await sleep(300);
 const panMetres=Math.hypot(...pan.target.map((v,i)=>v-initial.target[i]));
 const walkMetres=Math.hypot(...walkAfter.camera.map((v,i)=>v-walkBefore.camera[i]));
 const result={panMetres,pinchDistanceBefore:distance(pan),pinchDistanceAfter:distance(pinch),pageScale:scale,labelSampleCount:labelSamples[0].length,labelDriftPx:labelDrift,walkMetres,walkMode:walkAfter.mode,returnMode:(await evaluate('window.campusDiagnostics()')).mode};
 result.passed=panMetres>1&&distance(pinch)<distance(pan)*.98&&scale===1&&labelSamples.every(sample=>sample.length<=3)&&labelDrift<=2&&walkAfter.mode==='walk'&&walkMetres>1&&result.returnMode==='orbit';
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
 await mouseClick('#search');await send('Input.insertText',{text:'钱学森'});await sleep(300);await mouseClick('#place-list button');await sleep(1700);
 const selected=await evaluate('window.campusDiagnostics()');
 const result={rotationMetres:Math.hypot(...rotated.camera.map((v,i)=>v-initial.camera[i])),distanceBeforeWheel:distance(rotated),distanceAfterWheel:distance(zoomed),treeLayerTrianglesBefore:zoomed.triangles,treeLayerTrianglesHidden:hidden.triangles,selected:selected.selected};
 result.passed=result.rotationMetres>2&&distance(zoomed)<distance(rotated)*.98&&hidden.triangles<zoomed.triangles*.8&&selected.selected==='钱学森图书馆';return result;
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
 for(const width of widths)for(const pose of poses){
  const start=Date.now(),errorStart=errors.length,httpStart=httpErrors.length,height=width<768?844:900;
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:dpr,mobile:width<768});
  await send('Emulation.setTouchEmulationEnabled',{enabled:width<768,maxTouchPoints:2});
  const url=new URL(origin);url.searchParams.set('__qa_pose',pose+'-'+width);
  // Unlike hash-only navigation, a changed query creates a fresh document.
  if(pose==='home'){}else if(pose.startsWith('place:')||pose.startsWith('group:')){url.hash=pose.slice(6);if(pose.startsWith('group:'))url.searchParams.set('group','1');}else url.searchParams.set('inspection',pose==='north-wall-oblique'?'north-wall':pose);
  await send('Page.navigate',{url:url.href});
  let loaded=false;for(let i=0;i<160;i++){await sleep(200);loaded=await evaluate('!!window.__campusReady && document.querySelector("#loading").hidden');if(loaded)break;}
  if(!loaded)throw Error('Scene did not become ready: '+url.href);
  await sleep(1800);
  if(pose==='north-wall-oblique'){
   const x=width*.6,y=height*.45,delta=width*.065;
   await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',buttons:1,clickCount:1});
   for(let i=1;i<=12;i++)await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:x+delta*i/12,y,button:'left',buttons:1});
   await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:x+delta,y,button:'left',clickCount:1});await sleep(900);
  }
  if(pose.startsWith('group:'))await sleep(1700);
  const runtime=await evaluate('window.campusDiagnostics()');
  if(pose.startsWith('group:')&&runtime.groupView?.name!==pose.slice(6))throw Error('Building group view mismatch: '+pose);
  if(pose.startsWith('place:')&&runtime.selected!==pose.slice(6))throw Error('Screenshot target mismatch: expected '+pose.slice(6)+', got '+runtime.selected);
  const metrics=await evaluate('({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,canvasWidth:document.querySelector("#scene canvas").width,overflow:document.documentElement.scrollWidth>innerWidth,script:document.querySelector("script[type=module]")?.src,scale:visualViewport.scale})');
  const gpu=await evaluate('(()=>{const g=document.querySelector("#scene canvas").getContext("webgl2"),e=g.getExtension("WEBGL_debug_renderer_info");return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER)})()');
  const file=pose.replace(/[^\p{L}\p{N}-]/gu,'_')+'-'+width+'.png';
  const png=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(out,file),Buffer.from(png.result.data,'base64'));
  const r={pose,url:url.href,width,height,file,elapsedMs:Date.now()-start,metrics,gpu,runtime,errors:errors.slice(errorStart),httpErrors:httpErrors.slice(httpStart)};
  if(interactionChecks&&width<768&&pose==='home'){
   r.interactions=await inspectInteractions();
   const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(out,'touch-after-'+width+'.png'),Buffer.from(shot.result.data,'base64'));
   r.errors=errors.slice(errorStart);r.httpErrors=httpErrors.slice(httpStart);console.log(JSON.stringify({interactions:r.interactions}));
  }
  if(interactionChecks&&width>=768&&pose==='home'){
   r.interactions=await inspectDesktopInteractions();
   const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(out,'desktop-after-'+width+'.png'),Buffer.from(shot.result.data,'base64'));
   r.errors=errors.slice(errorStart);r.httpErrors=httpErrors.slice(httpStart);console.log(JSON.stringify({desktopInteractions:r.interactions}));
  }
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
