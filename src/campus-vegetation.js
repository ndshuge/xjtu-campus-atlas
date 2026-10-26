import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {rng,BASE,pointIn,pointSegment} from './geo.js';

// Original geometry/textures, informed by XJTU's 2024 avenue photographs.
// Tree positions, heights and species assignments remain interpretive.
export const VEGETATION_LOD={desktop:170,mobile:110,hysteresis:22};
export const CROWN_RADIUS_FACTOR=1.7;
const buildingBoundsCache=new WeakMap();
export function fitTreeToBuildings(tree,buildings){
 let distance=Infinity;
 for(const b of buildings){
  // Low roofs below the crown do not intersect the foliage volume.
  if(b.height<tree.h*.56)continue;
  let box=buildingBoundsCache.get(b);
  if(!box){box=b.points.reduce((r,p)=>[Math.min(r[0],p[0]),Math.min(r[1],p[1]),Math.max(r[2],p[0]),Math.max(r[3],p[1])],[Infinity,Infinity,-Infinity,-Infinity]);buildingBoundsCache.set(b,box);}
  const envelope=tree.r*CROWN_RADIUS_FACTOR+.4;
  if(tree.x<box[0]-envelope||tree.x>box[2]+envelope||tree.z<box[1]-envelope||tree.z>box[3]+envelope)continue;
  if(pointIn([tree.x,tree.z],b.points)&&!(b.holes||[]).some(h=>pointIn([tree.x,tree.z],h)))distance=0;
  for(const ring of [b.points,...(b.holes||[])])for(let i=1;i<ring.length;i++)distance=Math.min(distance,pointSegment([tree.x,tree.z],ring[i-1],ring[i]).distance);
 }
 const radius=Math.min(tree.r,Math.max(.2,(distance-.4)/CROWN_RADIUS_FACTOR));
 return{...tree,r:radius,clearanceAdjusted:radius<tree.r-.01};
}
const UP=new THREE.Vector3(0,1,0);
function join(geos){const g=mergeGeometries(geos.map(g=>g.index?g.toNonIndexed():g),false);geos.forEach(g=>g.dispose());g.computeBoundingSphere();return g;}
function twig(a,b,r0,r1,sides=6){
 const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),axis=to.clone().sub(from);
 const g=new THREE.CylinderGeometry(r1,r0,axis.length(),sides,1);
 g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP,axis.normalize()));
 g.translate(...from.add(to).multiplyScalar(.5).toArray());return g;
}
export function treeGeometry(kind='plane',detail='near',seed=1956){
 const rand=rng(seed),near=detail==='near',conifer=kind==='cedar',stems=[],leaves=[];
 const branch=(a,b,r0,r1)=>twig(a,b,r0,r1,near?6:4);
 const fork=conifer?7:4.4;
 stems.push(branch([0,0,0],[.08,fork,0],.28,.16));
 const limbs=conifer?7:4;
 for(let i=0;i<limbs;i++){
  const a=i/limbs*Math.PI*2+rand()*.42;
  const end=conifer?[Math.cos(a)*1.65,4.0+i*.6,Math.sin(a)*1.65]:[Math.cos(a)*1.65,7.5+rand()*.6,Math.sin(a)*1.65];
  if(conifer)stems.push(branch([.05,3.7+i*.65,0],end,.13,.055));
  else{
   const elbow=[Math.cos(a)*.65,5.2+(i%2)*.4,Math.sin(a)*.65];
   if(near){stems.push(branch([.03,3.65,0],elbow,.18,.12));stems.push(branch(elbow,end,.12,.055));}
   else stems.push(branch([.03,3.65,0],end,.18,.055));
  }
  if(near&&!conifer)for(let j=0;j<2;j++){
   const b=a+(j?1:-1)*.5;stems.push(branch(end,[end[0]+Math.cos(b)*1.1,end[1]+1.4,end[2]+Math.sin(b)*1.1],.05,.015));
  }
 }
 const clusters=conifer?(near?68:32):(near?92:45);
 for(let i=0;i<clusters;i++){
  const a=i*2.399963,rad=conifer?(.35+rand()*.65)*(1-i/clusters)*3.2:Math.sqrt((i+.5)/clusters)*3.5;
  const y=conifer?3.0+i/clusters*7.7:6.8+Math.sqrt(Math.max(0,1-rad*rad/13))*2.4+(rand()-.5)*1.9;
  const size=(conifer?.95:1.25)*(near?1:1.4)*(0.8+rand()*.4);
  const g=new THREE.PlaneGeometry(size*1.8,size,1,1);
  // Staggered sprays with holes and lobed leaf margins, not closed crown spheres.
  g.rotateX((rand()-.5)*Math.PI);g.rotateY(a+rand());g.rotateZ((rand()-.5)*1.0);
  g.translate(Math.cos(a)*rad,y,Math.sin(a)*rad);
  const c=new THREE.Color(conifer?'#718b65':'#95ad75').multiplyScalar(.76+rand()*.30);
  const colors=[];for(let v=0;v<g.attributes.position.count;v++)colors.push(c.r,c.g,c.b);
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));leaves.push(g);
 }
 return{wood:join(stems),leaves:join(leaves),leafCards:clusters};
}
export function makeLeafSprayTexture(conifer=false,distant=false){
 const cv=document.createElement('canvas');cv.width=cv.height=256;const c=cv.getContext('2d'),rand=rng(conifer?581:7156);
 c.clearRect(0,0,256,256);
 // Dense far sprays survive texture minification. Reusing the sparse near
 // texture erased the crown at campus-overview distances after alpha testing.
 const count=distant?(conifer?400:340):(conifer?240:150);
 for(let i=0;i<count;i++){
  const a=rand()*Math.PI*2,r=Math.sqrt(rand())*102,x=128+Math.cos(a)*r,y=128+Math.sin(a)*r*.75;
  c.save();c.translate(x,y);c.rotate(rand()*6.28);const s=conifer?5:8+rand()*9;
  c.fillStyle=['#d6e3bf','#e4eccc','#b9cc9e','#c7d8ab'][i%4];
  if(conifer){c.fillRect(-s,-1,s*2,2.5);}else{
   c.beginPath();c.moveTo(0,s);
   for(let j=0;j<10;j++){const ang=-Math.PI/2+j*Math.PI/5,rr=j%2?s*.48:s;c.lineTo(Math.cos(ang)*rr,Math.sin(ang)*rr);}
   c.closePath();c.fill();c.strokeStyle='#7d9365';c.lineWidth=.6;c.beginPath();c.moveTo(0,s);c.lineTo(0,-s*.65);c.stroke();
  }c.restore();
 }
 const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=8;tx.generateMipmaps=true;tx.minFilter=THREE.LinearMipmapLinearFilter;return tx;
}
function barkMaterial(){
 const m=new THREE.MeshStandardMaterial({color:'#b2ad9b',roughness:1});
 m.onBeforeCompile=s=>{
  s.vertexShader='varying vec3 vBark;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBark=position;');
  s.fragmentShader=`varying vec3 vBark;
   float barkHash(vec3 p){return fract(sin(dot(p,vec3(14.6,39.2,75.3)))*42325.4);}
   float barkNoise(vec3 p){vec3 c=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(mix(barkHash(c),barkHash(c+vec3(1,0,0)),f.x),mix(barkHash(c+vec3(0,1,0)),barkHash(c+vec3(1,1,0)),f.x),f.y),mix(mix(barkHash(c+vec3(0,0,1)),barkHash(c+vec3(1,0,1)),f.x),mix(barkHash(c+vec3(0,1,1)),barkHash(c+vec3(1,1,1)),f.x),f.y),f.z);
   }\n`+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float barkTone=smoothstep(.34,.66,barkNoise(vBark*vec3(12.,4.,12.)));
   diffuseColor.rgb*=mix(vec3(.68,.68,.63),vec3(1.10,1.07,.96),barkTone);
  `);
 };m.customProgramCacheKey=()=> 'campus-bark-r6';return m;
}
export function createCampusVegetation(trees,{mobile=false}={}){
 const group=new THREE.Group();group.name='Photo-informed campus vegetation / positions and dimensions illustrative';
 const wood=barkMaterial(),batches=[],dummy=new THREE.Object3D(),classification=new Int8Array(trees.length).fill(-1);
 const species=['grove','cedar','plane'];
 for(let kind=0;kind<3;kind++){
  const members=trees.map((t,i)=>({t,i})).filter(o=>(o.t.type===1?1:o.t.type===2?2:0)===kind);
  if(!members.length)continue;
  for(const detail of ['near','far']){
   const distant=detail==='far',tex=makeLeafSprayTexture(kind===1,distant);
   const leafMat=new THREE.MeshStandardMaterial({map:tex,color:'#d8e5bd',vertexColors:true,side:THREE.DoubleSide,alphaTest:distant?.12:.38,alphaToCoverage:!distant,roughness:1,depthWrite:true,emissive:'#34482c',emissiveIntensity:.10});
   const geo=treeGeometry(kind===1?'cedar':'plane',detail,1956+kind*37);
   const trunk=new THREE.InstancedMesh(geo.wood,wood,members.length),crown=new THREE.InstancedMesh(geo.leaves,leafMat,members.length);
   trunk.name=species[kind]+' branching '+detail;crown.name=species[kind]+' leaf sprays '+detail;
   trunk.count=crown.count=0;trunk.castShadow=!mobile&&detail==='near';crown.castShadow=!mobile&&detail==='near';trunk.receiveShadow=crown.receiveShadow=true;
   group.add(trunk,crown);batches.push({kind,detail,members,trunk,crown});
  }
 }
 const avenue=trees.filter(t=>t.type===2);
 const white=new THREE.InstancedMesh(new THREE.CylinderGeometry(.27,.3,1,8),new THREE.MeshStandardMaterial({color:'#e5e3d9',roughness:1}),avenue.length);
 white.name='whitewashed plane tree bases / unmeasured extent';avenue.forEach((t,i)=>{const h=1.5+t.c*.35;dummy.position.set(t.x,BASE+h/2,t.z);dummy.rotation.set(0,0,0);dummy.scale.set(t.r/3.6*1.06,h,t.r/3.6*1.06);dummy.updateMatrix();white.setMatrixAt(i,dummy.matrix);});white.computeBoundingSphere();group.add(white);
 let last=new THREE.Vector3(Infinity,Infinity,Infinity),lastTime=-Infinity;
 const update=(camera,now=performance.now(),force=false)=>{
  if(!force&&now-lastTime<260)return;
  if(!force&&camera.position.distanceToSquared(last)<9)return;
  lastTime=now;last.copy(camera.position);
  const cutoff=mobile?VEGETATION_LOD.mobile:VEGETATION_LOD.desktop;
  trees.forEach((t,i)=>{const d=Math.hypot(t.x-last.x,t.z-last.z,last.y-(BASE+t.h*.7));const threshold=cutoff+(classification[i]===1?VEGETATION_LOD.hysteresis:0);classification[i]=d<threshold?1:0;});
  for(const batch of batches){let n=0;for(const {t,i} of batch.members){if((batch.detail==='near')!==(classification[i]===1))continue;
   dummy.position.set(t.x,BASE,t.z);dummy.rotation.set(0,t.c*Math.PI*2,0);dummy.scale.set(t.r/3.6,t.h/10.2,t.r/3.6);dummy.updateMatrix();
   batch.trunk.setMatrixAt(n,dummy.matrix);batch.crown.setMatrixAt(n,dummy.matrix);batch.crown.setColorAt(n,new THREE.Color().setHSL(.24+t.c*.035,.18,.68+t.c*.12));n++;
  }for(const mesh of [batch.trunk,batch.crown]){mesh.count=n;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}}
  group.userData.nearTrees=[...classification].filter(n=>n===1).length;group.userData.farTrees=trees.length-group.userData.nearTrees;
 };
 group.userData={version:'leaf-sprays-r6',positions:'existing procedural coordinates, not a tree survey',species:'avenue plane-tree class / conifer-like groves; exact species unverified',originalTexture:true,treeCount:trees.length,clearanceAdjustedTrees:trees.filter(t=>t.clearanceAdjusted).length,lod:VEGETATION_LOD};
 return{group,update};
}
