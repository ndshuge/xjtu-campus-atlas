// Isolated Edge CDP acceptance of the optional synthetic game lab.
import {spawn} from 'node:child_process';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const url=process.argv[2]||'http://127.0.0.1:18992/r17-game-lab-20261031/r17-lab.html';
const output=path.resolve(process.argv[3]||'docs/quality-v2/r17-game-lab-qa');
await fs.mkdir(output,{recursive:true});
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'xjtu-r17-lab-'));
const edge=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
 '--headless=new','--no-first-run','--disable-extensions','--disable-background-networking',
 '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'
],{stdio:'ignore',windowsHide:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let socket,id=0;const pending=new Map(),errors=[],httpErrors=[],reports=[];
const send=(method,params={})=>new Promise((resolve,reject)=>{
 const req=++id,timer=setTimeout(()=>{pending.delete(req);reject(Error('CDP timeout '+method))},20000);
 pending.set(req,{resolve:x=>{clearTimeout(timer);resolve(x)},reject});
 socket.send(JSON.stringify({id:req,method,params}));
});
const evaluate=async expression=>{
 const x=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(x.result?.exceptionDetails)throw Error(JSON.stringify(x.result.exceptionDetails));
 return x.result?.result?.value;
};
const screenshot=async file=>{
 const a=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 await fs.writeFile(path.join(output,file),Buffer.from(a.result.data,'base64'));
};
async function click(selector,mobile){
 const rect=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)})?.getBoundingClientRect();return r&&{x:r.x+r.width/2,y:r.y+r.height/2,width:r.width}})()`);
 if(!rect?.width)throw Error('invisible control: '+selector);
 await pointClick(rect.x,rect.y,mobile);
}
async function pointClick(x,y,mobile){
 if(mobile){
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1,radiusX:3,radiusY:3}]});
  await sleep(120);await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }else{
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});
 }
}
try{
 let port;for(let i=0;i<80;i++){try{port=(await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break}catch{}await sleep(150)}
 if(!port)throw Error('Headless Edge debug port unavailable');
 const pages=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());
 socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true})});
 socket.addEventListener('message',e=>{
  const m=JSON.parse(e.data);
  if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m)}
  if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);
  if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params);
  if(m.method==='Network.responseReceived'&&m.params.response.status>=400)httpErrors.push({url:m.params.response.url,status:m.params.response.status});
 });
 await Promise.all(['Page.enable','Runtime.enable','Network.enable','Log.enable'].map(x=>send(x)));
 for(const width of [390,1440]){
  const mobile=width<700,height=mobile?844:900,atErrors=errors.length,atHttp=httpErrors.length;
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
  await send('Emulation.setTouchEmulationEnabled',{enabled:mobile,maxTouchPoints:2});
  await send('Page.navigate',{url:'about:blank'});await send('Page.navigate',{url});
  let ready=false;
  for(let n=0;n<110;n++){await sleep(200);ready=await evaluate('typeof window.r17LabDiagnostics==="function"&&window.r17LabDiagnostics().frames>10');if(ready)break}
  if(!ready)throw Error('R17 3D lab did not render '+width);
  await screenshot('explore-'+width+'.png');
  const initial=await evaluate('window.r17LabDiagnostics()');
  if(initial.mode!=='explore'||initial.drawCalls<1||!initial.fixtureOnly)throw Error('lab baseline invalid '+width);
  await click('#mode-race',mobile);await sleep(250);
  const before=await evaluate('window.r17LabDiagnostics()');
  if(before.mode!=='raceSandbox'||!before.carPosition)throw Error('race did not enter '+width);
  if(mobile){
   const p=await evaluate('(()=>{const r=document.querySelector("#drive-forward").getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()');
   await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,id:1}]});await sleep(850);
   await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }else{
   await send('Input.dispatchKeyEvent',{type:'keyDown',key:'w',code:'KeyW',windowsVirtualKeyCode:87});
   await sleep(850);
   await send('Input.dispatchKeyEvent',{type:'keyUp',key:'w',code:'KeyW',windowsVirtualKeyCode:87});
  }
  await sleep(130);
  const after=await evaluate('window.r17LabDiagnostics()');
  if(Math.hypot(after.carPosition[0]-before.carPosition[0],after.carPosition[2]-before.carPosition[2])<.2)
   throw Error('race car did not respond to real input '+width);
  if(!mobile){
   await send('Input.dispatchKeyEvent',{type:'keyDown',key:'w',code:'KeyW',windowsVirtualKeyCode:87});
   await sleep(150);
   await evaluate('window.dispatchEvent(new Event("blur"))');
   const blurStop=await evaluate('window.r17LabDiagnostics().carPosition');
   await sleep(350);
   const blurAfter=await evaluate('window.r17LabDiagnostics().carPosition');
   await send('Input.dispatchKeyEvent',{type:'keyUp',key:'w',code:'KeyW',windowsVirtualKeyCode:87});
   if(Math.hypot(...blurAfter.map((v,i)=>v-blurStop[i]))>.13)
    throw Error('Race continues driving after window blur '+width);
  }
  await screenshot('race-'+width+'.png');
  await click('#mode-target',mobile);await sleep(300);
  const target=await evaluate('window.r17LabTargetPoint()');
  if(!target||!Number.isFinite(target.x))throw Error('No target projection '+width);
  await pointClick(target.x,target.y,mobile);await sleep(350);
  const shot=await evaluate('window.r17LabDiagnostics()');
  if(shot.mode!=='targetPractice'||shot.score!==1)throw Error('target ray click not accepted '+width);
  await pointClick(target.x,target.y,mobile);await sleep(160);
  const repeat=await evaluate('window.r17LabDiagnostics()');
  if(repeat.score!==1)throw Error('Repeated target hit incorrectly increased score '+width);
  await screenshot('target-'+width+'.png');
  await click('#mode-explore',mobile);await sleep(120);
  const restored=await evaluate('window.r17LabDiagnostics()');
  if(restored.mode!=='explore'||restored.carPosition)throw Error('mode did not restore cleanly '+width);
  const overflow=await evaluate('document.documentElement.scrollWidth>innerWidth');
  if(overflow)throw Error('horizontal overflow '+width);
  const e=errors.slice(atErrors),h=httpErrors.slice(atHttp);
  if(e.length||h.length)throw Error('Browser errors '+width+' '+JSON.stringify({e,h}));
  reports.push({width,initial,before,after,shot,restored,errors:e,httpErrors:h});
  console.log(JSON.stringify({width,mode:restored.mode,calls:initial.drawCalls,triangles:initial.triangles,raceDisplacement:Math.hypot(after.carPosition[0]-before.carPosition[0],after.carPosition[2]-before.carPosition[2]),score:shot.score,errors:e.length,httpErrors:h.length}));
 }
 await fs.writeFile(path.join(output,'results.json'),JSON.stringify({url,reports,limitations:'Synthetic lab and headless Edge only; not a real university driveable route or physical iPhone.'},null,2));
}finally{
 try{if(socket?.readyState===WebSocket.OPEN)await send('Browser.close')}catch{}
 socket?.close();edge.kill();
 await fs.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100}).catch(()=>{});
}
