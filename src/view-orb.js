import {createSpring} from './vendor/liquid-glass.js';

/** Pointer-first orientation pad. It owns its pointers so map gestures never leak through. */
export function attachViewOrb(world){
 const orb=document.querySelector('#view-orb'),surface=document.querySelector('#view-navigation');
 const face=orb.querySelector('.orb-surface');
 const pressSpring=createSpring(0,value=>face.style.setProperty('--orb-press',String(1-.035*value)),{stiffness:520,damping:38});
 const points=new Map();let pinching=false,lastDistance=0,hadMultiple=false,moved=false,lastTap=null;
 let velocity={yaw:0,pitch:0},lastMove=0,inertiaFrame=0;
 const stopInertia=()=>{if(inertiaFrame)cancelAnimationFrame(inertiaFrame);inertiaFrame=0;velocity={yaw:0,pitch:0};};
 const coast=()=>{
  if(world.reduced||performance.now()-lastMove>110||Math.hypot(velocity.yaw,velocity.pitch)<.00008)return;
  let previous=performance.now();
  const tick=now=>{const dt=Math.min(32,now-previous);previous=now;const decay=Math.exp(-dt/90);
   world.turnView(velocity.yaw*dt,velocity.pitch*dt);velocity.yaw*=decay;velocity.pitch*=decay;
   if(Math.hypot(velocity.yaw,velocity.pitch)>.00004)inertiaFrame=requestAnimationFrame(tick);else stopInertia();
  };
  inertiaFrame=requestAnimationFrame(tick);
 };
 // Any new pointer action takes ownership immediately, including map pans and buttons.
 addEventListener('pointerdown',stopInertia,{capture:true});
 addEventListener('keydown',stopInertia,{capture:true});
 addEventListener('blur',stopInertia);
 const distance=()=>{const [a,b]=[...points.values()];return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;};
 const release=e=>{
  if(!points.has(e.pointerId))return;
  const p=points.get(e.pointerId);points.delete(e.pointerId);
  if(points.size<2){pinching=false;lastDistance=0;}
  if(!points.size){
   surface.classList.remove('is-active');
   pressSpring.set(0);
   if(e.type==='pointerup'&&!moved&&!hadMultiple&&e.pointerType==='touch'){
    const now=performance.now();
    if(lastTap&&now-lastTap.time<330&&Math.hypot(p.x-lastTap.x,p.y-lastTap.y)<25){world.resetViewLook();lastTap=null;}
    else lastTap={time:now,x:p.x,y:p.y};
   }else if(moved||hadMultiple||e.type==='pointercancel')lastTap=null;
   if(e.type==='pointerup'&&moved&&!hadMultiple)coast();else stopInertia();
   hadMultiple=false;moved=false;
  }
 };
 orb.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  e.preventDefault();e.stopPropagation();orb.setPointerCapture(e.pointerId);
  points.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,time:performance.now()});surface.classList.add('is-active');
  pressSpring.set(1);
  if(points.size===1){moved=false;world.beginViewLook();}
  else if(points.size===2){hadMultiple=true;pinching=true;lastDistance=distance();lastTap=null;}
 });
 orb.addEventListener('pointermove',e=>{
  const p=points.get(e.pointerId);if(!p)return;e.preventDefault();e.stopPropagation();
  const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(pinching&&points.size===2){const next=distance();if(lastDistance>0&&next>0)world.zoomView(lastDistance/next,false);lastDistance=next;moved=true;}
  else if(points.size===1){if(Math.abs(dx)+Math.abs(dy)>.1){const now=performance.now(),dt=Math.max(8,Math.min(80,now-p.time));
   velocity.yaw=clamp(-dx*.008/dt,-.0012,.0012);velocity.pitch=clamp(-dy*.008/dt,-.0012,.0012);lastMove=now;p.time=now;
   moved=moved||Math.hypot(p.x-p.startX,p.y-p.startY)>5;world.turnView(-dx*.008,-dy*.008);}}
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture'])orb.addEventListener(type,release);
 orb.addEventListener('dblclick',e=>{e.preventDefault();world.resetViewLook();});
 orb.addEventListener('keydown',e=>{
  if(world.racingActive)return; // Let racing controls own R and steering keys.
  stopInertia();
  const step=e.shiftKey ? .16 : .07,turns={ArrowLeft:[step,0],ArrowRight:[-step,0],ArrowUp:[0,step],ArrowDown:[0,-step]};
  if(turns[e.key]){e.preventDefault();e.stopPropagation();world.beginViewLook();world.turnView(...turns[e.key]);}
  else if(e.key==='+'||e.key==='='){e.preventDefault();e.stopPropagation();world.zoomView(.82);}
  else if(e.key==='-'||e.key==='_'){e.preventDefault();e.stopPropagation();world.zoomView(1.22);}
  else if(e.key==='Home'){e.preventDefault();e.stopPropagation();world.north();}
  else if(e.key==='r'||e.key==='R'){e.preventDefault();e.stopPropagation();world.resetViewLook();}
 });
 world.viewZoomButtons={in:document.querySelector('#zoom-in'),out:document.querySelector('#zoom-out')};
 world.viewZoomButtons.in.onclick=()=>world.zoomView(.82);
 world.viewZoomButtons.out.onclick=()=>world.zoomView(1.22);
 document.querySelector('#view-reset').onclick=()=>{stopInertia();world.resetViewLook();};
 const grid=document.querySelector('#orb-grid'),needle=document.querySelector('#compass-needle');
 let lastYaw=NaN,lastPitch=NaN;
 world.updateViewInstrument=()=>{
  const p=world.camera.position,t=world.controls.target,dx=t.x-p.x,dy=t.y-p.y,dz=t.z-p.z;
  const yaw=world.mode==='walk'?(world.walkYaw||0):Math.atan2(-dx,-dz);
  const pitch=world.mode==='walk'?(world.walkPitch||0):Math.atan2(dy,Math.hypot(dx,dz));
  if(Math.abs(yaw-lastYaw)<.002&&Math.abs(pitch-lastPitch)<.002)return;
  lastYaw=yaw;lastPitch=pitch;const degrees=180/Math.PI;
  grid.style.transform=`rotate(${-yaw*degrees}deg) rotateX(${-pitch*degrees}deg)`;
  needle.style.transform=`rotate(${-yaw*degrees}deg)`;
 };
 world.updateViewInstrument();
}

function clamp(value,min,max){return Math.max(min,Math.min(max,value));}
