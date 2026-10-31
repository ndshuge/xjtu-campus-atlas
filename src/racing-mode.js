import {createGameModeHost} from './game-mode-host.js'
import {createRacingPhysics} from './racing/physics.js'
import {createSyntheticTrack} from './racing/track.js'
import {createCampusDriveTrack,planCampusDrive} from './racing/campus-track.js'
import {createDesktopInput,createTouchInput} from './racing/controls.js'
import {loadVehicleVisuals} from './racing/visuals.js'
import {createDriveCameraRig} from './racing/camera-rig.js'
import './racing-mode.css'

const PRACTICE_ORIGIN=[1800,0,1800]
const PRACTICE_SPAWN=[1800,2.1,1782]
const FIXED=1/60
const touchLayout=()=>matchMedia('(pointer: coarse)').matches||innerWidth<700
function makeControls(){
 const node=document.createElement('section')
 node.id='racing-overlay'
 node.setAttribute('aria-label','真实物理赛车实验场')
 node.innerHTML=`
 <div class="race-top"><div class="race-brand"><strong>ATLAS <em>DRIVE</em></strong><span id="race-place">校园道路 · 梧桐东道</span><button type="button" id="race-switch">切换至独立练车场</button></div>
 <div class="race-actions"><button id="race-camera" type="button">切换视角 <kbd>C</kbd></button><button id="race-reset" type="button">复位 <kbd>R</kbd></button><button id="race-exit" type="button">返回校园 <kbd>Esc</kbd></button></div></div>
 <div class="race-speed"><strong id="race-speed-number">000</strong><small>km/h</small><p>悬挂接地 <span id="race-contact">0/4</span></p></div>
 <div class="race-hint">真实四轮 RaycastVehicle 物理 · 校园道路高程与宽度未经实测，仅供虚拟驾驶<br/>WASD / 方向键 · Space 手刹 · S 低速倒车</div>
 <div class="race-mobile"><div class="race-steer" id="race-stick"><span>左右转向</span><div id="race-stick-knob"></div></div>
 <div class="race-pedals"><button id="race-handbrake">手刹</button><button id="race-reverse">倒车</button><button id="race-brake">制动</button><button id="race-gas">油门</button></div></div>`
 return node
}

export function createAtlasRacingMode(world,{notify=()=>{}}={}){
 if(!world?.renderer||!world?.scene||!world?.camera||!world?.controls)throw Error('Atlas scene required')
 let loading=null,exitRequested=false
 const host=createGameModeHost({
  capture:()=>({
   position:world.camera.position.clone(),quaternion:world.camera.quaternion.clone(),
   fov:world.camera.fov,near:world.camera.near,up:world.camera.up.clone(),
   target:world.controls.target.clone(),enabled:world.controls.enabled,
   auto:world.auto,flight:world.flight,viewTransition:world.viewTransition,
   viewZoomTransition:world.viewZoomTransition,tourPaused:world.tour?.paused,
   worldMode:world.mode
  }),
  restore:s=>{
   world.racingActive=false;world.driveModeHost=null
   document.body.classList.remove('racing-mode')
   world.camera.position.copy(s.position);world.camera.quaternion.copy(s.quaternion)
   world.camera.up.copy(s.up);world.camera.fov=s.fov;world.camera.near=s.near
   world.camera.updateProjectionMatrix()
   world.controls.target.copy(s.target);world.controls.enabled=s.enabled
   world.controls.autoRotate=s.auto;world.auto=s.auto;world.mode=s.worldMode
   world.flight=null;world.viewTransition=null;world.viewZoomTransition=null
   if(world.tour&&s.tourPaused!==undefined){world.tour.paused=s.tourPaused;world.tour.next=performance.now()+8000}
   world.keys.clear();world.controls.update()
   world.updateLabels();world.drawMinimap()
  }
 })
 host.registerMode({
  id:'race',
  async onEnter({options,onCleanup}){
   // Register cleanup immediately: async GLB failure must restore the map.
   world.racingActive=true;world.driveModeHost=host
   document.body.classList.add('racing-mode')
   world.keys.clear();world.flight=null;world.viewTransition=null;world.viewZoomTransition=null
   if(world.tour)world.tour.paused=true
   world.controls.enabled=false
   for(const item of world.labelItems)item.el.hidden=true
   const ui=makeControls();document.body.append(ui)
   onCleanup(()=>ui.remove())
   const practice=options.arena==='practice'
   const course=practice?null:planCampusDrive(world.data)
   const spawn=practice?PRACTICE_SPAWN:course.spawn
   const sim=createRacingPhysics({spawn,heading:course?.heading??0})
   onCleanup(()=>sim.destroy())
   const track=practice?
    createSyntheticTrack({physics:sim,scene:world.scene,origin:PRACTICE_ORIGIN}):
    createCampusDriveTrack({physics:sim,data:world.data,course,trees:world.treePositions||[]})
   onCleanup(()=>track.destroy())
   ui.querySelector('#race-place').textContent=practice?'独立合成练车场 · 实验场景':'校园实景 · 梧桐东道｜平面高程模拟'
   ui.querySelector('#race-switch').textContent=practice?'返回校园道路':'切换至独立练车场'
   const cameraRig=createDriveCameraRig(world.camera)
   cameraRig.reset()
   world.camera.position.set(spawn[0]-Math.sin(course?.heading??0)*9,spawn[1]+4,spawn[2]-Math.cos(course?.heading??0)*9)
   world.camera.near=.1;world.camera.updateProjectionMatrix()
   const base=new URL('models/racing/',document.baseURI)
   const visuals=await loadVehicleVisuals(world.scene,{
    bodyUrl:new URL('race.glb',base).href,
    wheelUrl:new URL('wheel-racing.glb',base).href
   })
   onCleanup(()=>visuals.destroy())
   let input=null,inputMode='',accumulator=0
   const setInput=next=>sim.setInput(next)
   function cycle(){cameraRig.cycle()}
   function installInput(){
    const next=touchLayout()?'touch':'desktop'
    if(inputMode===next)return
    input?.destroy();input=null
    sim.setInput()
    inputMode=next
    if(next==='touch'){
     input=createTouchInput({
      stick:ui.querySelector('#race-stick'),gas:ui.querySelector('#race-gas'),
      brake:ui.querySelector('#race-brake'),handbrake:ui.querySelector('#race-handbrake'),
      reverse:ui.querySelector('#race-reverse'),onInput(v){
       setInput(v)
       const knob=ui.querySelector('#race-stick-knob')
       knob.style.transform='translateX('+Math.round(v.steer*30)+'px)'
      }
     })
    }else{
     input=createDesktopInput({
      windowTarget:window,documentTarget:document,
      onInput:setInput,onReset:()=>sim.reset(spawn),onCamera:cycle,onExit:()=>{void exit()}
     })
    }
   }
   installInput()
   onCleanup(()=>input?.destroy())
   const resize=()=>installInput()
   window.addEventListener('resize',resize,{passive:true})
   onCleanup(()=>window.removeEventListener('resize',resize))
   const cameraButton=ui.querySelector('#race-camera')
   const resetButton=ui.querySelector('#race-reset')
   const exitButton=ui.querySelector('#race-exit')
   cameraButton.addEventListener('click',cycle)
   resetButton.addEventListener('click',()=>sim.reset(spawn))
   ui.querySelector('#race-switch').addEventListener('click',()=>{void switchArena(practice?'campus':'practice')})
   exitButton.addEventListener('click',()=>{void exit()})
   // Rotate the chase camera with a mouse drag; the Atlas canvas remains owned by Atlas.
   let drag=null
   const canvas=world.renderer.domElement
   const down=e=>{if(e.pointerType!=='mouse'||e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId)}
   const move=e=>{if(!drag||drag.id!==e.pointerId)return;cameraRig.drag(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY}
   const up=e=>{if(drag?.id===e.pointerId)drag=null}
   canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move)
   canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up)
   onCleanup(()=>{canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up)})
   const safety=()=>{if(document.hidden||!document.hasFocus()) {input?.clear();sim.setInput();accumulator=0}}
   document.addEventListener('visibilitychange',safety)
   window.addEventListener('blur',safety)
   onCleanup(()=>{document.removeEventListener('visibilitychange',safety);window.removeEventListener('blur',safety)})
   this.onTick=dt=>{
    if(document.hidden)return
    accumulator=Math.min(accumulator+Math.min(dt,.055),.055)
    for(let n=0;n<4&&accumulator>=FIXED;n++){sim.stepFixed(FIXED);accumulator-=FIXED}
    const state=sim.getState()
    visuals.update(state)
    cameraRig.update(state,dt)
    ui.querySelector('#race-speed-number').textContent=String(Math.round(state.speedKmh)).padStart(3,'0')
    ui.querySelector('#race-contact').textContent=state.wheels.filter(w=>w.contact).length+'/4'
    window.__atlasRacingDiagnostics={speedKmh:state.speedKmh,position:state.position,contacts:state.wheels.filter(w=>w.contact).length,
     bodies:sim.world.bodies.length,visualWheels:visuals.wheels.length,
     arena:practice?'practice':'campus',routeId:course?.roadId??null,
     roadName:course?.name??null,roadWidth:course?.width??null,
     collisionStats:track.collisionStats??null,worldCamera:world.camera.position.toArray()}
   }
   onCleanup(()=>{this.onTick=null;delete window.__atlasRacingDiagnostics})
  }
 })
 async function enter(options={}){
  if(loading)return loading
  if(host.mode==='race')return {mode:'race'}
  exitRequested=false
  loading=host.enterMode('race',options)
  const result=await loading;loading=null
  if(exitRequested&&result.mode==='race')await host.exitMode()
  if(result.reason)notify('赛车加载失败，已恢复校园地图')
  return result
 }
 async function switchArena(arena){
  await exit()
  return enter({arena})
 }
 async function exit(){
  if(loading){exitRequested=true;await loading;return host.exitMode()}
  return host.exitMode()
 }
 return {enter,exit,host}
}
