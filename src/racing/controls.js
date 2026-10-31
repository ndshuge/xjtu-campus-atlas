/** Device-specific control adapters for an Atlas-owned race-mode lifecycle. */
const zero=()=>({throttle:0,steer:0,brake:0,handbrake:false})
const clamp=v=>Math.max(-1,Math.min(1,Number.isFinite(v)?v:0))
const typing=element=>{
  const tag=element?.tagName?.toUpperCase?.() ?? ''
  return ['INPUT','TEXTAREA','SELECT'].includes(tag) || !!element?.isContentEditable
}
export function createDesktopInput({windowTarget=window,documentTarget=document,onInput,onReset=()=>{},onCamera=()=>{},onExit=()=>{}}){
  const down=new Set()
  let disposed=false
  const map=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'])
  const state=()=>({
    throttle:down.has('KeyW')||down.has('ArrowUp')?1:down.has('KeyS')||down.has('ArrowDown')?-1:0,
    steer:(down.has('KeyD')||down.has('ArrowRight')?1:0)-(down.has('KeyA')||down.has('ArrowLeft')?1:0),
    brake:down.has('KeyS')||down.has('ArrowDown')?1:0,
    handbrake:down.has('Space')
  })
  const emit=()=>onInput(state())
  function downKey(e){
    if(typing(e.target)||typing(documentTarget.activeElement))return
    if(map.has(e.code)){
      down.add(e.code);e.preventDefault?.();emit()
    }else if(!e.repeat&&e.code==='KeyR')onReset()
    else if(!e.repeat&&e.code==='KeyC')onCamera()
    else if(!e.repeat&&e.code==='Escape')onExit()
  }
  function upKey(e){if(down.delete(e.code))emit()}
  function clear(){if(disposed)return;down.clear();onInput(zero())}
  function visibility(){if(documentTarget.hidden)clear()}
  windowTarget.addEventListener('keydown',downKey)
  windowTarget.addEventListener('keyup',upKey)
  windowTarget.addEventListener('blur',clear)
  documentTarget.addEventListener('visibilitychange',visibility)
  emit()
  return {clear,destroy(){
    if(disposed)return
    clear();disposed=true
    windowTarget.removeEventListener('keydown',downKey)
    windowTarget.removeEventListener('keyup',upKey)
    windowTarget.removeEventListener('blur',clear)
    documentTarget.removeEventListener('visibilitychange',visibility)
  }}
}
export function createTouchInput({stick,gas,brake,handbrake,reverse=null,windowTarget=window,documentTarget=document,onInput}){
  let stickId=null, steer=0, disposed=false
  const held={gas:new Set(),brake:new Set(),handbrake:new Set(),reverse:new Set()}
  const callbacks=[]
  function listen(target,type,fn){target.addEventListener(type,fn,{passive:false});callbacks.push(()=>target.removeEventListener(type,fn))}
  const state=()=>({throttle:held.brake.size>0||(held.reverse.size>0&&held.gas.size>0)?0:held.reverse.size>0?-1:held.gas.size>0?1:0,steer:clamp(steer),
    brake:held.brake.size>0?1:0,handbrake:held.handbrake.size>0})
  const emit=()=>onInput(state())
  const clear=()=>{
    if(disposed)return
    stickId=null;steer=0
    for(const key of Object.keys(held))held[key].clear()
    onInput(zero())
  }
  function steerFromPointer(e){
    const rect=stick.getBoundingClientRect()
    const raw=clamp((e.clientX-(rect.left+rect.width/2))/(rect.width*0.4))
    const magnitude=Math.abs(raw)
    steer=magnitude<=0.085?0:Math.sign(raw)*Math.min(1,(magnitude-0.085)/0.915)
    emit()
  }
  function capture(el,id){try{el.setPointerCapture?.(id)}catch{/* detached node or simulated input */}}
  listen(stick,'pointerdown',e=>{
    if(stickId!==null)return
    e.preventDefault?.();stickId=e.pointerId;capture(stick,stickId);steerFromPointer(e)
  })
  listen(stick,'pointermove',e=>{if(e.pointerId===stickId)steerFromPointer(e)})
  const releaseStick=e=>{if(e.pointerId===stickId){stickId=null;steer=0;emit()}}
  for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(stick,type,releaseStick)
  for(const [key,el] of [['gas',gas],['brake',brake],['handbrake',handbrake],['reverse',reverse]]){
    if(!el)continue
    listen(el,'pointerdown',e=>{e.preventDefault?.();held[key].add(e.pointerId);capture(el,e.pointerId);emit()})
    for(const type of ['pointerup','pointercancel','lostpointercapture'])
      listen(el,type,e=>{if(held[key].delete(e.pointerId))emit()})
  }
  const releaseGlobal=e=>{
    if(e.pointerId===stickId){stickId=null;steer=0}
    let changed=false
    for(const group of Object.values(held))changed=group.delete(e.pointerId)||changed
    if(changed||steer===0)emit()
  }
  for(const type of ['pointerup','pointercancel'])listen(windowTarget,type,releaseGlobal)
  listen(windowTarget,'blur',clear)
  listen(documentTarget,'visibilitychange',()=>{if(documentTarget.hidden)clear()})
  emit()
  return {clear,destroy(){if(disposed)return;clear();disposed=true;for(const unlisten of callbacks)unlisten()}}
}
