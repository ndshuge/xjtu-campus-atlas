import * as THREE from 'three';
import {flat} from './geo.js';
import {createIsolatedLevelPatch} from './campus-level-patch.js';
import {createGameModeHost} from './game-mode-host.js';
import {createRaceSandbox} from './modes/race-sandbox.js';
import {createTargetPractice} from './modes/target-practice.js';

// This page uses a deliberately synthetic fixture, never the real university footprint.
const canvas=document.querySelector('#lab-canvas'),title=document.querySelector('#mode-name');
const instructions=document.querySelector('#mode-instructions'),score=document.querySelector('#mode-score');
const touch=document.querySelector('#touch-controls');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false})}
catch(error){title.textContent='WebGL 不可用';instructions.textContent='请使用普通校园地图；实验模式不影响主产品。';throw error}
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
const scene=new THREE.Scene();scene.background=new THREE.Color('#b3c4b4');
scene.fog=new THREE.Fog('#b3c4b4',80,150);
scene.add(new THREE.HemisphereLight(0xffffff,0x647e70,2.2));
const sun=new THREE.DirectionalLight(0xffebd1,3.3);sun.position.set(-15,40,24);scene.add(sun);
const camera=new THREE.PerspectiveCamera(48,1,.1,180);
camera.position.set(37,31,39);camera.lookAt(0,0,0);
const model=new THREE.Group();scene.add(model);
const grass=new THREE.MeshStandardMaterial({color:'#738f6f',roughness:1,side:THREE.DoubleSide});
const outer=[[-14,-14],[14,-14],[14,14],[-14,14]];
const distant=[[-90,-90],[90,-90],[90,90],[-90,90]];
const outerGround=new THREE.Mesh(flat(distant,1,[outer]),grass);model.add(outerGround);
const patch=createIsolatedLevelPatch({outer,hole:[[-5,-5],[5,-5],[5,5],[-5,5]],upperY:1.1,lowerY:-2,kind:'fixture'});
model.add(patch);
const marker=new THREE.Mesh(new THREE.RingGeometry(19.2,20,100),new THREE.MeshStandardMaterial({color:'#cfd6b7',side:THREE.DoubleSide}));
marker.rotation.x=-Math.PI/2;marker.position.y=1.13;model.add(marker);
const baseRoad=new THREE.Mesh(new THREE.RingGeometry(14.4,19.1,100),new THREE.MeshStandardMaterial({color:'#455859',roughness:.99,side:THREE.DoubleSide}));
baseRoad.rotation.x=-Math.PI/2;baseRoad.position.y=1.14;model.add(baseRoad);
const lane=new THREE.Mesh(new THREE.RingGeometry(16.5,16.59,100),new THREE.MeshBasicMaterial({color:'#dce0c8',side:THREE.DoubleSide}));
lane.rotation.x=-Math.PI/2;lane.position.y=1.17;model.add(lane);
const animateGroup=(group,onCleanup)=>{scene.add(group);onCleanup(()=>{scene.remove(group);group.traverse(node=>{node.geometry?.dispose();if(node.material)node.material.dispose()})})};
const host=createGameModeHost({
 capture:()=>({position:camera.position.toArray(),quaternion:camera.quaternion.toArray()}),
 restore:state=>{camera.position.fromArray(state.position);camera.quaternion.fromArray(state.quaternion)}
});
const checkpointLocations=[['north',0,-17],['east',17,0],['south',0,17],['west',-17,0]];
host.registerMode({
 id:'raceSandbox',
 onEnter:({onCleanup})=>{
  const group=new THREE.Group();animateGroup(group,onCleanup);
  const course=createRaceSandbox({checkpoints:checkpointLocations.map(x=>x[0]),lapCount:1});
  const car=new THREE.Mesh(new THREE.BoxGeometry(1.35,.65,2.5),new THREE.MeshStandardMaterial({color:'#e9a552',metalness:.12,roughness:.62}));
  window.__r17RaceCar=car;
  car.position.set(0,1.63,-17);group.add(car);
  for(const [,x,z] of checkpointLocations){
   const gate=new THREE.Mesh(new THREE.TorusGeometry(2,.10,6,24),new THREE.MeshBasicMaterial({color:'#bfe1ba'}));
   gate.position.set(x,3,z);gate.rotation.x=Math.PI/2;group.add(gate);
  }
  const keys=new Set(),abort=new AbortController();let heading=Math.PI/2;
  document.addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyD','ArrowUp','ArrowLeft','ArrowRight'].includes(e.code)){keys.add(e.code);e.preventDefault()}},{signal:abort.signal});
  document.addEventListener('keyup',e=>keys.delete(e.code),{signal:abort.signal});
  // Losing focus must release virtual acceleration, including without a keyup.
  window.addEventListener('blur',()=>keys.clear(),{signal:abort.signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)keys.clear()},{signal:abort.signal});
  for(const [id,key] of [['drive-left','KeyA'],['drive-forward','KeyW'],['drive-right','KeyD']]){
   const button=document.getElementById(id);
   button.addEventListener('pointerdown',e=>{keys.add(key);button.setPointerCapture(e.pointerId);e.preventDefault()},{signal:abort.signal});
   button.addEventListener('pointerup',()=>keys.delete(key),{signal:abort.signal});
   button.addEventListener('pointercancel',()=>keys.delete(key),{signal:abort.signal});
  }
  touch.hidden=false;
  title.textContent='封闭路线计时';
  instructions.textContent='W/↑ 前进，A/D 或 ←/→ 转向；触屏使用右下角按键。完成四个检查点，禁止现实校园驾驶。';
  const first=checkpointLocations[0];course.pass(first[0],performance.now());
  let nextCheckpoint=1;
  score.textContent='已通过 1/4 个检查点';
  window.__r17RaceTick=dt=>{
   const turning=(keys.has('KeyA')||keys.has('ArrowLeft')?-1:0)+(keys.has('KeyD')||keys.has('ArrowRight')?1:0);
   heading+=turning*dt*1.8;
   car.rotation.y=heading;
   if((keys.has('KeyW')||keys.has('ArrowUp'))&&!course.completed){
    car.position.x+=Math.sin(heading)*dt*10;
    car.position.z-=Math.cos(heading)*dt*10;
    const radius=Math.hypot(car.position.x,car.position.z);
    if(radius<14.4||radius>19.1){
     const corrected=THREE.MathUtils.clamp(radius,14.4,19.1)/Math.max(.001,radius);
     car.position.x*=corrected;car.position.z*=corrected;
    }
   }
   const point=checkpointLocations[nextCheckpoint];
   if(point&&Math.hypot(car.position.x-point[1],car.position.z-point[2])<2.8&&course.pass(point[0],performance.now())){
    nextCheckpoint++;
    score.textContent=course.completed?'完成路线：'+(course.elapsedMs/1000).toFixed(1)+' 秒':'已通过 '+nextCheckpoint+'/4 个检查点';
   }
  };
  onCleanup(()=>{window.__r17RaceTick=null;window.__r17RaceCar=null;abort.abort();keys.clear();touch.hidden=true;score.textContent='已返回浏览模式'});
  return (function noop(){});
 },
 onTick(dt){
  // All input state is owned by this mode's onEnter closure through the active callback.
  window.__r17RaceTick?.(dt);
 },
 onExit(){window.__r17RaceTick=null},
 dispose(){window.__r17RaceTick=null}
});
// Attach a per-session tick by wrapping onEnter in the mode host (no global listeners retained).
// Separate mode setup keeps the demo entirely outside the public campus renderer.
const targetSession={score:0};
host.registerMode({
 id:'targetPractice',
 onEnter:({onCleanup})=>{
  const group=new THREE.Group();animateGroup(group,onCleanup);
  const practice=createTargetPractice({targetIds:['board-1','board-2','board-3','board-4']});
  const targets=[];
  window.__r17TargetMeshes=targets;
  for(let i=0;i<4;i++){
   const sphere=new THREE.Mesh(new THREE.SphereGeometry(1.05,16,12),new THREE.MeshStandardMaterial({color:i%2?'#d2b763':'#cc685b',roughness:.7}));
   sphere.position.set(-10+i*6.6,4,4+i%2*4);sphere.userData.targetId='board-'+(i+1);targets.push(sphere);group.add(sphere);
  }
  const ray=new THREE.Raycaster(),cursor=new THREE.Vector2(),abort=new AbortController();
  canvas.addEventListener('pointerup',e=>{
   const rect=canvas.getBoundingClientRect();
   cursor.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
   ray.setFromCamera(cursor,camera);
   const hit=ray.intersectObjects(targets,false)[0];
   if(hit&&practice.hit(hit.object.userData.targetId)){
    hit.object.material.color.set('#91c68d');score.textContent='命中 '+practice.score+' 次';
    targetSession.score=practice.score;
   }
  },{signal:abort.signal});
  targetSession.score=0;title.textContent='独立靶标练习';instructions.textContent='点击或轻触彩色球体计分。目标仅存在于独立练习场景。';score.textContent='命中 0 次';
  onCleanup(()=>{window.__r17TargetMeshes=null;abort.abort();score.textContent='已返回浏览模式'});
 }
});
const btns={'explore':'mode-explore','raceSandbox':'mode-race','targetPractice':'mode-target'};
let switching=false;
async function setMode(mode){
 if(switching)return;switching=true;
 try{
  if(mode==='explore')await host.exitMode();else await host.enterMode(mode);
  for(const [key,id] of Object.entries(btns))document.getElementById(id).setAttribute('aria-pressed',String(key===host.mode));
  if(host.mode==='explore'){title.textContent='浏览模式';instructions.textContent='合成多层空间可见，但不代表图书馆的真实高程；无授权通道不可通行。';score.textContent='原地图不受影响';}
 }finally{switching=false}
}
for(const [key,id] of Object.entries(btns))document.getElementById(id).addEventListener('click',()=>setMode(key));
function resize(){
 const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,width<=700?1.5:2));
 renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
}
const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
let previous=performance.now(),frames=0;
function frame(now){
 const dt=Math.min(.04,Math.max(0,(now-previous)/1000));previous=now;host.tick(dt);
 renderer.render(scene,camera);frames++;requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.r17LabDiagnostics=()=>({mode:host.mode,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,frames,score:targetSession.score,carPosition:window.__r17RaceCar?.position.toArray()||null,fixtureOnly:true,webgl:true});
window.r17LabTargetPoint=()=>{const t=window.__r17TargetMeshes?.[1];if(!t)return null;const v=t.position.clone().project(camera),r=canvas.getBoundingClientRect();return{x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2};};
