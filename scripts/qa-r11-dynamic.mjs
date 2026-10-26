// R11 repeatable mobile-Chromium multi-frame and gesture acceptance (NOT Safari).
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const origin=process.argv[2]||'http://127.0.0.1:18977/';
const poses=(process.argv[4]||'avenue-east,north-gate,plaza,library-north').split(',');
const output=path.resolve(process.argv[3]||'docs/quality-v2/r11-dynamic');
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'xjtu-r11-edge-'));
const edge=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
 '--headless=new','--no-first-run','--disable-extensions','--disable-background-networking',
 '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'
],{stdio:'ignore',windowsHide:true});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let socket,seq=0;
const pending=new Map(),errors=[],httpErrors=[],results=[];
const send=(method,params={})=>new Promise((resolve,reject)=>{
 const id=++seq;
 const timeout=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},20000);
 pending.set(id,{resolve:v=>{clearTimeout(timeout);resolve(v);},reject:e=>{clearTimeout(timeout);reject(e);}});
 socket.send(JSON.stringify({id,method,params}));
});
async function js(expression){
 const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(r.error||r.result?.exceptionDetails)throw Error('Runtime: '+JSON.stringify(r));
 return r.result.result?.value;
}
async function screenshot(name){
 const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 await fs.writeFile(path.join(output,name+'.png'),Buffer.from(r.result.data,'base64'));
}
const reading="(()=>{const d=window.campusDiagnostics(),c=document.querySelector('#scene canvas');return {camera:d.camera,target:d.target,mode:d.mode,quality:d.quality,foliageCoverageMaterials:d.foliageCoverageMaterials,dpr:d.renderPixelRatio,deviceDpr:devicePixelRatio,width:innerWidth,height:innerHeight,canvas:[c.width,c.height],canvasPixels:c.width*c.height,drawCalls:d.drawCalls,triangles:d.triangles,frameStats:d.frameStats,fps:d.fps,loadMs:d.sceneLoadMs,contextLost:d.contextLost,errors:d.errors,visibleLabels:d.visibleLabels}})()";
const snapshot=()=>js(reading);
async function quality(mode){
 await js("(()=>{const e=document.querySelector('#quality');e.value='"+mode+"';e.dispatchEvent(new Event('change',{bubbles:true}));return true})()");
 await wait(340);
}
async function touch(type,positions){
 await send('Input.dispatchTouchEvent',{type,touchPoints:positions.map(p=>({x:p[0],y:p[1],id:p[2],radiusX:4,radiusY:4}))});
}
async function gesture(kind){
 if(kind==='pan'){
  await touch('touchStart',[[167,245,1]]);
  for(let i=1;i<=14;i++){await touch('touchMove',[[167+i*3,245+i*1.8,1]]);await wait(30);}
  await touch('touchEnd',[]);
 }else{
  await touch('touchStart',[[112,245,1],[267,245,2]]);
  for(let i=1;i<=16;i++){
   let a,b;
   if(kind==='pinch'){a=[112-i*2,245,1];b=[267+i*2,245,2];}
   else if(kind==='rotate'){a=[112,245-i*1.2,1];b=[267,245+i*1.2,2];}
   else {a=[112,245+i*1.5,1];b=[267,245+i*1.5,2];}
   await touch('touchMove',[a,b]);await wait(30);
  }
  await touch('touchEnd',[]);
 }
}
async function scene(pose){
 const url=new URL(origin);
 url.searchParams.set('__r11_case',pose);
 if(pose==='plaza')url.hash='四大发明广场';
 else url.searchParams.set('inspection',pose);
 await send('Page.navigate',{url:url.href});
 let loaded=false;
 for(let i=0;i<130;i++){
  await wait(200);
  try{loaded=await js("!!window.__campusReady && !!document.querySelector('#loading')?.hidden");}catch{}
  if(loaded)break;
 }
 if(!loaded)throw Error('Scene load timed out: '+pose);
 await send('Emulation.setTouchEmulationEnabled',{enabled:false});
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
 await wait(950);
 await quality('low');
 const start=await snapshot();
 const hit=await js("(()=>{const e=document.elementFromPoint(167,245);return {tag:e?.tagName,id:e?.id,classes:String(e?.className||'').slice(0,80)}})()");
 await screenshot(pose+'-low-start');
 await gesture('pan');
 await screenshot(pose+'-pan-motion');
 await wait(380);
 const pan=await snapshot();
 await gesture('pinch');
 await screenshot(pose+'-pinch-motion');
 await wait(500);
 const pinch=await snapshot();
 await gesture('rotate');
 await gesture('pitch');
 await wait(650);
 const end=await snapshot();
 await screenshot(pose+'-settled');
 const moved=Math.hypot(...pan.target.map((v,i)=>v-start.target[i]));
 const distance=d=>Math.hypot(...d.camera.map((v,i)=>v-d.target[i]));
 const pinchDelta=distance(pinch)-distance(pan);
 const minCameraY=Math.min(start.camera[1],pan.camera[1],pinch.camera[1],end.camera[1]);
 const item={pose,hit,low:{start,pan,pinch,end},gesture:{panTargetDelta:moved,pinchDistanceDelta:pinchDelta,minCameraY},pass:{pan:moved>0.1,pinch:pinchDelta<-.1,cameraSafe:minCameraY>=4.2,finite:[start,pan,pinch,end].every(x=>Number.isFinite(x.camera[1])&&Number.isFinite(x.canvasPixels))}};
 if(pose==='avenue-east'||pose==='plaza'){
  await quality('high');
  item.high=await snapshot();
  await screenshot(pose+'-high');
  await quality('low');
 }
 results.push(item);
 console.log(JSON.stringify({pose,gesture:item.gesture,pass:item.pass,pixels:start.canvasPixels,p95ms:end.frameStats?.p95Ms,drawCalls:end.drawCalls,triangles:end.triangles}));
}
try{
 await fs.mkdir(output,{recursive:true});
 let port;
 for(let i=0;i<100;i++){try{port=(await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{}await wait(130);}
 if(!port)throw Error('Edge DevTools port missing');
 const tabs=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());
 socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((ok,bad)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',bad,{once:true});});
 socket.addEventListener('message',e=>{
  const m=JSON.parse(e.data);
  if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m);}
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails?.text);
  if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')errors.push(m.params.entry.text);
  if(m.method==='Network.responseReceived'&&m.params.response.status>=400)httpErrors.push([m.params.response.status,m.params.response.url]);
 });
 await send('Runtime.enable');await send('Page.enable');await send('Log.enable');await send('Network.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
 for(const pose of poses)await scene(pose);
 // Same pose, lower device DPR: valid control against internal-pixel overdraw.
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await wait(600);const dpr1=await snapshot();
 // WEBGL_lose_context simulates event recovery, not Safari background eviction.
 const contextAvailable=await js("(()=>{const gl=document.querySelector('#scene canvas').getContext('webgl2');const ext=gl.getExtension('WEBGL_lose_context');if(!ext)return false;window.__r11ContextExt=ext;ext.loseContext();return true})()");
 let restoration={supported:contextAvailable};
 if(contextAvailable){
  await wait(380);restoration.lost=await snapshot();
  await js("window.__r11ContextExt.restoreContext()");
  await wait(1600);restoration.restored=await snapshot();
  restoration.passed=restoration.lost.contextLost===true&&restoration.restored.contextLost===false&&restoration.restored.drawCalls>0;
 }
 const gpu=await js("(()=>{const gl=document.querySelector('#scene canvas').getContext('webgl2');const e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)})()");
 const report={date:new Date().toISOString(),gpu,origin,environment:'Windows Edge Headless WebGL, mobile CDP emulation; NOT an iPhone Safari test',cases:results,dpr1,restoration,errors,httpErrors,passed:results.every(r=>Object.values(r.pass).every(Boolean))&&(!restoration.supported||restoration.passed)&&!errors.length&&!httpErrors.length};
 await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({passed:report.passed,scenes:results.length,restoration:restoration.passed,errors, httpErrors,dpr1Pixels:dpr1.canvasPixels}));
 if(!report.passed)process.exitCode=1;
}catch(e){console.error(e.stack||String(e));process.exitCode=2;}
finally{
 try{if(socket?.readyState===WebSocket.OPEN){socket.send(JSON.stringify({id:++seq,method:'Browser.close'}));await wait(700);}}catch{}
 socket?.close();edge.kill();
}
