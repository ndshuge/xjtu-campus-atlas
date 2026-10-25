import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const port=18893;
const exe='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profile=path.join(os.tmpdir(),'xjtu-touch-qa-'+process.pid);
const flags=[
 '--headless=new','--disable-extensions','--disable-background-networking',
 '--enable-unsafe-swiftshader','--use-angle=swiftshader',
 '--remote-debugging-port='+port,'--user-data-dir='+profile,
 '--no-first-run','--window-size=390,844','about:blank'
];
const edge=spawn(exe,flags,{stdio:'ignore',windowsHide:true});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let sock;
let id=0;
const pending=new Map();
function send(method,params={}){
 const n=++id;
 return new Promise((resolve,reject)=>{
  pending.set(n,{resolve,reject});
  sock.send(JSON.stringify({id:n,method,params}));
 });
}
async function evaluate(expression){
 const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(r.error||r.result?.exceptionDetails)throw Error(JSON.stringify(r));
 return r.result.result.value;
}
const snapExpression=`(()=>{
 const labels=[...document.querySelectorAll('.label')].filter(el=>el.offsetParent!==null).slice(0,12);
 return {
  width:document.documentElement.clientWidth,
  labels:labels.map(el=>({name:el.textContent,x:parseFloat(el.style.left),y:parseFloat(el.style.top)})).filter(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)),
  canvasTouch:document.querySelector('#scene canvas')?.style.touchAction||getComputedStyle(document.querySelector('#scene canvas')).touchAction
 };
})()`;
try{
 let target;
 for(let tries=0;tries<40;tries++){
  try{
   const tabs=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());
   target=tabs.find(t=>t.type==='page'&&t.webSocketDebuggerUrl);
   if(target)break;
  }catch{}
  await wait(250);
 }
 if(!target)throw Error('Edge CDP did not start');
 sock=new WebSocket(target.webSocketDebuggerUrl);
 sock.addEventListener('message',ev=>{
  const msg=JSON.parse(ev.data);
  if(msg.id&&pending.has(msg.id)){
   const x=pending.get(msg.id);pending.delete(msg.id);
   msg.error?x.reject(Error(JSON.stringify(msg.error))):x.resolve(msg);
  }
 });
 await new Promise((resolve,reject)=>{sock.addEventListener('open',resolve,{once:true});sock.addEventListener('error',reject,{once:true});});
 await send('Page.enable');
 await send('Runtime.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
 await send('Page.navigate',{url:'http://127.0.0.1:18865/'});
 await wait(5200);
 const before=await evaluate(snapExpression);
 if(before.width>430)throw Error('Mobile viewport did not apply');
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:185,y:330,id:1,radiusX:3,radiusY:3}]});
 for(let i=1;i<=13;i++){
  await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:185+i*5,y:330+i*2.6,id:1,radiusX:3,radiusY:3}]});
  await wait(25);
 }
 await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await wait(1100);
 const after=await evaluate(snapExpression);
 const matched=[];
 for(const a of before.labels){
  const b=after.labels.find(l=>l.name===a.name);
  if(b)matched.push({name:a.name,dx:Math.round(b.x-a.x),dy:Math.round(b.y-a.y)});
 }
 const median=a=>a.length?a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)]:0;
 const shift={x:median(matched.map(t=>t.dx)),y:median(matched.map(t=>t.dy))};
 const pass=matched.length>=2&&Math.hypot(shift.x,shift.y)>8;
 const output={passed:pass,viewport:before.width,shift,matched:matched.slice(0,7),note:'CDP Edge touchscreen emulation; does not substitute real iPhone Safari'};
 fs.mkdirSync('docs/quality-v2',{recursive:true});
 fs.writeFileSync('docs/quality-v2/qa-touch-pan-result.json',JSON.stringify(output,null,2));
 console.log(JSON.stringify(output));
 if(!pass)process.exitCode=1;
}catch(err){console.error(String(err));process.exitCode=2;}finally{
 try{sock?.close()}catch{}
 try{edge.kill()}catch{}
}
