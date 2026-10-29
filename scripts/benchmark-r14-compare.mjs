import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const urls=[process.argv[2],process.argv[3]];
if(urls.some(x=>!x))throw Error('usage: node benchmark-r14-compare.mjs <base-url> <candidate-url> [output-dir]');
const output=path.resolve(process.argv[4]||'docs/quality-v2/r14-performance-ab');
const candidateLabel=process.argv[5]||'spatial';
const poses=(process.argv[6]||'home,avenue-east,library-north,main-e').split(',');
await fs.mkdir(output,{recursive:true});
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'r14-compare-edge-'));
const edge=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--no-first-run','--disable-extensions','--disable-background-networking','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});
const wait=ms=>new Promise(r=>setTimeout(r,ms));let socket,seq=0;const pending=new Map(),errors=[];
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;const t=setTimeout(()=>reject(Error('CDP timeout '+method)),60000);pending.set(id,{resolve:v=>{clearTimeout(t);resolve(v)},reject});socket.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.result.exceptionDetails)throw Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value;};
const summary=a=>{const s=a.slice().sort((x,y)=>x-y);return {n:s.length,mean:s.reduce((x,y)=>x+y,0)/s.length,p50:s[Math.floor((s.length-1)*.5)],p95:s[Math.floor((s.length-1)*.95)],p99:s[Math.floor((s.length-1)*.99)]}};
try{
 let port;for(let i=0;i<100;i++){try{port=(await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break}catch{await wait(150)}}if(!port)throw Error('Edge startup failed');
 const tabs=await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json());socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((ok,bad)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',bad,{once:true})});socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m)}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text)});
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 const results=[];for(const pose of poses)for(let rep=0;rep<3;rep++)for(const variant of (rep%2?[1,0]:[0,1])){
  const url=new URL('r14-performance.html',urls[variant]);if(pose!=='home')url.searchParams.set('inspection',pose);await send('Page.navigate',{url:url.href});let ready=false;for(let i=0;i<200;i++){await wait(150);try{ready=await evaluate('!!window.__campusReady && !!window.__r14World && document.querySelector("#loading").hidden')}catch{}if(ready)break}if(!ready)throw Error('scene not ready '+url);await wait(2200);
  const env=await evaluate(`(()=>{const w=window.__r14World,g=w.renderer.getContext(),e=g.getExtension('WEBGL_debug_renderer_info');return {gpu:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER),browser:navigator.userAgent,dpr:devicePixelRatio,renderDpr:w.renderer.getPixelRatio(),camera:w.camera.position.toArray(),target:w.controls.target.toArray(),shadows:w.renderer.shadowMap.enabled,trees:w.treeCount}})()`);
  if(rep===0){const img=await send('Page.captureScreenshot',{format:'png'});await fs.writeFile(path.join(output,pose+'-'+(variant?candidateLabel:'base')+'.png'),Buffer.from(img.result.data,'base64'));}
  const measured=await evaluate(`new Promise(resolve=>{const w=window.__r14World,p=w.camera.position.clone(),q=w.controls.target.clone();let stamps=[],first=null,warm=0;const tick=t=>{if(first===null)first=t;const dx=14*Math.sin((t-first)/1000*1.2);w.camera.position.copy(p);w.controls.target.copy(q);w.camera.position.x+=dx;w.controls.target.x+=dx;if(warm++>45)stamps.push(t);if(stamps.length<181){requestAnimationFrame(tick);return}const d=window.campusDiagnostics();resolve({intervals:stamps.slice(1).map((x,i)=>x-stamps[i]),drawCalls:d.drawCalls,triangles:d.triangles,geometries:d.geometries,textures:d.textures,nearTrees:d.vegetation.nearTrees})};requestAnimationFrame(tick)})`);
  const result={pose,rep,variant:variant?candidateLabel:'base',env,frames:summary(measured.intervals),...measured};results.push(result);console.log(JSON.stringify({pose,rep,variant:result.variant,frames:result.frames,drawCalls:result.drawCalls,triangles:result.triangles}));
 }
 await fs.writeFile(path.join(output,'results.json'),JSON.stringify({testedAt:new Date().toISOString(),method:`Same Edge process, alternating production-build baseline 99eb615 and ${candidateLabel}; 1440x900 DPR1, 3 runs per pose and variant, sinusoidal pan, 45 warm-up and 180 samples. Headless timing is not GPU utilization or device FPS.`,errors,results},null,2));
}finally{try{if(socket?.readyState===WebSocket.OPEN){socket.send(JSON.stringify({id:++seq,method:'Browser.close'}));await wait(300)}}catch{}socket?.close();edge.kill()}
