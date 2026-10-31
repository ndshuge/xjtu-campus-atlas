/**
 * Opt-in, on-device evidence collection; not an automated Safari certification.
 * Never transmit analytics. The user manually exports a local report.
 */
const round=(n,digits=1)=>Number.isFinite(n)?Number(n.toFixed(digits)):null
const limitPush=(list,value,max)=>{if(list.length>=max)list.shift();list.push(value)}

export function identifySafariPlatform(userAgent=''){
 const ua=String(userAgent)
 if(!/iPhone|iPad|iPod/i.test(ua))return 'other'
 if(/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(ua))return 'ios-other-browser-ua'
 return /AppleWebKit/i.test(ua)&&/Safari/i.test(ua)?'ios-safari-ua':'ios-unknown-ua'
}

export function createMobileQaSession({now=Date.now,userAgent=''}={}){
 const samples=[],events=[]
 const livePointers=new Set()
 const touch={downs:0,ups:0,cancels:0,maxConcurrent:0}
 const platform=identifySafariPlatform(userAgent)
 let startedAt=null,endedAt=null,running=false
 function addEvent(type,detail){if(!running)return;limitPush(events,{timeMs:now()-startedAt,type,...detail},350)}
 return {
  start(){startedAt=now();endedAt=null;running=true;samples.length=events.length=0;livePointers.clear();Object.assign(touch,{downs:0,ups:0,cancels:0,maxConcurrent:0})},
  pointer(action,target,id){
   if(!running)return
   if(action==='down'){livePointers.add(id);touch.downs++}
   if(action==='up'){livePointers.delete(id);touch.ups++}
   if(action==='cancel'){livePointers.delete(id);touch.cancels++}
   touch.maxConcurrent=Math.max(touch.maxConcurrent,livePointers.size)
   if(action==='down'||action==='cancel')addEvent('pointer',{action,target:String(target).slice(0,48)})
  },
  visibility(state){addEvent('visibility',{state})},
  note(label){addEvent('manual',{label:String(label).slice(0,80)})},
  error(message){addEvent('pageerror',{message:String(message).slice(0,220)})},
  sample(s){
   if(!running)return
   const w=s.width??0,h=s.height??0
   limitPush(samples,{
    timeMs:now()-startedAt,
    arena:s.arena||'none',
    fps:round(s.fps,0),speedKmh:round(s.speedKmh,1),
    contacts:Number.isFinite(s.contacts)?s.contacts:null,
    roadName:s.roadName||null,
    canvasPixels:Number.isFinite(s.canvasPixels)?s.canvasPixels:null,
    width:w,height:h,orientation:w>h?'landscape':'portrait'
   },900)
  },
  stop(){if(running){endedAt=now();running=false;livePointers.clear()}},
  get isRunning(){return running},
  report(){return{
   schema:'atlas-r20-device-qa-v1',
   verification:'UNVERIFIED_NEEDS_DEVICE_REVIEW',
   platform,
   userAgent:String(userAgent).slice(0,380),
   startedAt,endedAt,durationMs:startedAt===null?0:(endedAt??now())-startedAt,
   touch:{...touch},samples:[...samples],events:[...events]
  }}
 }
}

export function installSafariQaPanel({getCampus=()=>null,getRace=()=>null}={}){
 void import('./safari-qa.css')
 if(document.getElementById('safari-qa-root'))return
 const qa=createMobileQaSession({userAgent:navigator.userAgent})
 const root=document.createElement('section')
 root.id='safari-qa-root'
 root.setAttribute('aria-label','Safari 真机测试工具')
 root.innerHTML=`
 <details><summary>设备验收 · R20</summary>
  <div class="safari-qa-panel">
   <strong>设备端驾驶采样</strong>
   <p>先点「开始记录」，再进入赛车，用两根手指同时转向和加速，测试制动、倒车、切换道路、横竖屏、退出和再次进入。</p>
   <small id="safari-qa-device"></small>
   <p id="safari-qa-status" role="status">未开始采样</p>
   <div><button type="button" id="safari-qa-start">开始记录</button><button type="button" id="safari-qa-stop" disabled>结束记录</button></div>
   <div><button type="button" id="safari-qa-export" disabled>保存/分享 JSON</button><button type="button" id="safari-qa-note">标记异常</button></div>
   <p class="safari-qa-disclaimer">采样只保留在当前浏览器，手动导出时才分享。UA 不足以证明真机，报告仍需审查，绝不自动判定 Safari 通过。</p>
  </div>
 </details>`
 document.body.append(root)
 const $=sel=>root.querySelector(sel)
 const start=$('#safari-qa-start'),stop=$('#safari-qa-stop'),out=$('#safari-qa-export'),status=$('#safari-qa-status')
 $('#safari-qa-device').textContent=qa.report().platform==='ios-safari-ua'?'检测到 iOS Safari 标识（未核验物理设备）':'当前未检测到 iOS Safari 标识'
 let timer=null
 const snapshot=()=>{
  if(!qa.isRunning)return
  const campus=getCampus()||{},race=getRace()||{}
  qa.sample({fps:campus.fps,canvasPixels:campus.canvasPixels,
   arena:race.arena??'none',speedKmh:race.speedKmh,
   contacts:race.contacts,roadName:race.roadName,
   width:window.innerWidth,height:window.innerHeight})
  const r=qa.report()
  status.textContent='已采样 '+r.samples.length+' 次 · 同时触点峰值 '+r.touch.maxConcurrent+' · 当前 '+(race.arena||'地图')
 }
 const onPointer=e=>{
  const target=e.target?.closest?.('#racing-overlay [id]')
  if(!target)return
  const name=target.id||'race-other'
  if(e.type==='pointerdown')qa.pointer('down',name,e.pointerId)
  if(e.type==='pointerup'||e.type==='lostpointercapture')qa.pointer('up',name,e.pointerId)
  if(e.type==='pointercancel')qa.pointer('cancel',name,e.pointerId)
 }
 const visibility=()=>qa.visibility(document.visibilityState)
 const onError=e=>qa.error(e?.message||String(e))
 const onReject=e=>qa.error(String(e?.reason))
 const onHide=()=>qa.visibility('pagehide')
 function watch(enabled){
  for(const name of ['pointerdown','pointerup','pointercancel','lostpointercapture']){
   document[enabled?'addEventListener':'removeEventListener'](name,onPointer,true)
  }
  document[enabled?'addEventListener':'removeEventListener']('visibilitychange',visibility)
  window[enabled?'addEventListener':'removeEventListener']('pagehide',onHide)
  window[enabled?'addEventListener':'removeEventListener']('error',onError)
  window[enabled?'addEventListener':'removeEventListener']('unhandledrejection',onReject)
 }
 start.onclick=()=>{
  qa.start();watch(true);snapshot()
  timer=setInterval(snapshot,500)
  start.disabled=true;stop.disabled=false;out.disabled=true
  status.textContent='采样中，请实际驾驶并测试手机旋转'
 }
 stop.onclick=()=>{
  if(timer){clearInterval(timer);timer=null}
  watch(false);qa.stop()
  start.disabled=false;stop.disabled=true;out.disabled=false
  const r=qa.report()
  status.textContent='记录已结束 · '+r.samples.length+' 次采样 · '+r.events.length+' 条事件；仍需人工核对'
 }
 $('#safari-qa-note').onclick=()=>qa.note('user-observed-issue')
 out.onclick=async()=>{
  const data=JSON.stringify(qa.report(),null,2)
  const filename='atlas-r20-mobile-qa-'+new Date().toISOString().replaceAll(':','-').slice(0,19)+'.json'
  const file=new File([data],filename,{type:'application/json'})
  try{
   if(navigator.share&&navigator.canShare?.({files:[file]})){
    await navigator.share({files:[file],title:'兴庆 3D Atlas 设备验收记录'})
    return
   }
  }catch(e){if(e.name==='AbortError')return}
  const url=URL.createObjectURL(file),anchor=document.createElement('a')
  anchor.href=url;anchor.download=filename;anchor.textContent='保存验收 JSON'
  root.append(anchor);anchor.click()
  setTimeout(()=>{anchor.remove();URL.revokeObjectURL(url)},4000)
 }
 return {session:qa,root,dispose(){if(timer)clearInterval(timer);watch(false);root.remove()}}
}
