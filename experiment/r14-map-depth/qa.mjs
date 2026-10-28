import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const out=path.resolve(process.argv[2]||'../../docs/quality-v2/r14-map-depth');
const origin=process.env.R14_DEPTH_URL||'http://127.0.0.1:18972';
await fs.mkdir(out,{recursive:true});
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'xjtu-r14-map-'));
const edge=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--no-first-run','--disable-extensions','--disable-background-networking','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let socket,id=0;const pending=new Map(),errors=[];
const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;const timeout=setTimeout(()=>reject(Error('CDP timeout '+method)),30000);pending.set(key,{resolve:x=>{clearTimeout(timeout);resolve(x)},reject});socket.send(JSON.stringify({id:key,method,params}))});
const evalJS=async expression=>{const x=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(x.result?.exceptionDetails)throw Error(JSON.stringify(x.result.exceptionDetails));return x.result?.result?.value};
const results=[];
try{
 let port;for(let i=0;i<80;i++){try{port=(await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break}catch{}await sleep(150)}if(!port)throw Error('Edge not started');
 const tabs=await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json());socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
 socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails)});
 await send('Page.enable');await send('Runtime.enable');
 for(const [width,height] of [[1440,900],[390,844]])for(const mode of ['shared','separate']){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768});
  await send('Page.navigate',{url:`${origin}/?mode=${mode}`});
  let ready;for(let i=0;i<100;i++){await sleep(200);ready=await evalJS('!!window.r14Depth && window.r14Depth.renderCount>1');if(ready)break}if(!ready)throw Error('Map did not initialize '+mode+' errors='+JSON.stringify(errors));
  await sleep(1200);
  for(const bearing of [0,180]){
   await evalJS(`window.r14Map.jumpTo({bearing:${bearing}});window.r14Map.triggerRepaint()`);await sleep(900);
   const filename=`${mode}-${width}-${bearing}.png`;const png=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(out,filename),Buffer.from(png.result.data,'base64'));
   const data=await evalJS('({...window.r14Depth,renderCount:window.r14Depth.renderCount,dpr:devicePixelRatio,center:window.r14Map.getCenter(),pitch:window.r14Map.getPitch(),bearing:window.r14Map.getBearing()})');
   if(data.draws!==1||data.mapContext!=='WebGL2RenderingContext'||data.errors.length)throw Error('Experiment failed: '+JSON.stringify(data));
   results.push({width,height,filename,...data});
  }
  if(width===1440){
   const samples=await evalJS(`(async()=>{let rounds=[];for(let n=0;n<3;n++){let times=[];let prev=performance.now();for(let i=0;i<90;i++){window.r14Map.triggerRepaint();await new Promise(requestAnimationFrame);let now=performance.now();times.push(now-prev);prev=now;}times.sort((a,b)=>a-b);rounds.push({count:times.length,mean:times.reduce((a,b)=>a+b,0)/times.length,p95:times[Math.floor(times.length*.95)],p99:times[Math.floor(times.length*.99)]});}return rounds})()`);
   results.push({width,height,mode,measurement:'90 repaint requests; animation frame intervals, not GPU timings or production benchmark',samples});
  }
 }
 await fs.writeFile(path.join(out,'results.json'),JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,errors},null,2));
}finally{try{await send('Browser.close')}catch{}edge.kill();socket?.close()}
