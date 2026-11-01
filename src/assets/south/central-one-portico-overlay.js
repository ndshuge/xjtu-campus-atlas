import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {planCells,cellBoundary} from '../../library-asset-plan.js';

export const CENTRAL_ONE_ID=263625088;
const SCHOOL_PHOTO='https://news.xjtu.edu.cn/info/1219/159211.htm';
const OVERVIEW_PHOTOS=[
 'https://commons.wikimedia.org/wiki/File:西交兴庆之俯瞰中一楼_01.jpg',
 'https://commons.wikimedia.org/wiki/File:西交兴庆之俯瞰中一楼_02.jpg'
];

// This is a DETAIL OVERLAY for createCentralBuildingsAsset, not an alternate
// building replacement. The existing central asset owns roof and four columns.
export function createCentralOnePorticoOverlay({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 if(building?.osmId!==CENTRAL_ONE_ID)throw Error('Expected central-one OSM 263625088');
 if(!Number.isInteger(buildingIndex)||buildingIndex<0)throw Error('Invalid central-one building index');
 const edges=cellBoundary(planCells(building.points));
 const face=edges.find(e=>e.length>16&&e.length<21&&(e.a[1]+e.b[1])*.5< -482&&e.nz<-.8);
 if(!face)throw Error('Central One north-facing projecting portico not found; review OSM change');
 const L=face.length,index=buildingIndex,height=building.height,c=L*.5;
 const a=(u,y,offset=.17)=>[
  face.a[0]+face.ux*u+face.nx*offset,
  baseY+y,
  face.a[1]+face.uz*u+face.nz*offset
 ];
 const b=ownedArchitecture('Center One photo-faithful upper portico details',{baseY,uniforms,stage,
  extraMaterials:{
   masonry:new THREE.MeshStandardMaterial({color:'#a6a9a5',roughness:.92,side:THREE.DoubleSide}),
   trim:new THREE.MeshStandardMaterial({color:'#b9bcb8',roughness:.85,side:THREE.DoubleSide}),
   steps:new THREE.MeshStandardMaterial({color:'#9f9f9a',roughness:.95}),
   door:new THREE.MeshStandardMaterial({color:'#344a52',roughness:.28,metalness:.12,side:THREE.DoubleSide})
  }});
 if(!b.gray){
  b.materials.masonry.color.set('#a6aaa6');
  b.materials.trim.color.set('#c1c3c0');
  b.materials.door.color.set('#344c50');
  b.materials.frame.color.set('#828d88');
  b.materials.steps.color.set('#a5a39e');
 }
 // Preserved portico: the original central model already has four pillars,
 // canopy, red-tile roof. Only fill the missing pentagonal upper facade.
 const gableWidth=9.3,lo=c-gableWidth*.5,hi=c+gableWidth*.5,peak=13.22;
 const polygon=[
  a(lo,9.18),a(hi,9.18),a(hi,11.37),a(c+2.95,peak),a(c-2.95,peak),a(lo,11.37)
 ];
 const tris=[],uvs=[];
 for(let i=1;i<polygon.length-1;i++){
  for(const k of [0,i,i+1]){tris.push(...polygon[k]);uvs.push(k%2,Math.floor(k/2)%2);}
 }
 const geom=new THREE.BufferGeometry();
 geom.setAttribute('position',new THREE.Float32BufferAttribute(tris,3));
 geom.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geom.computeVertexNormals();
 b.add('masonry',geom,index,height);
 // Thin projecting parapet follows the photo's sloping gable outline;
 // always stays in front of the old roof to reduce overlap artifacts.
 function band(p0,p1,thickness=.20){
  const v0=new THREE.Vector3(...p0),v1=new THREE.Vector3(...p1),dir=v1.clone().sub(v0);
  const g=new THREE.BoxGeometry(thickness,dir.length(),.13);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize()));
  g.translate(...v0.add(v1).multiplyScalar(.5).toArray());b.add('trim',g,index,height);
 }
 const trimOffset=.29;
 band(a(lo,11.37,trimOffset),a(c-2.95,peak,trimOffset));
 band(a(c-2.95,peak,trimOffset),a(c+2.95,peak,trimOffset));
 band(a(c+2.95,peak,trimOffset),a(hi,11.37,trimOffset));
 // Three small upper windows confirmed in the school exterior and aerial.
 // Count and relative spacing photo constrained; sizes remain estimates.
 for(const x of [c-2.02,c,c+2.02]){
  b.plane('door',face,x-.56,x+.56,10.30,11.60,index,height,.27);
  for(const [s0,s1] of [[x-.63,x-.55],[x+.55,x+.63]])
   b.plane('trim',face,s0,s1,10.24,11.66,index,height,.32);
  for(const y of [10.24,11.64])
   b.plane('trim',face,x-.63,x+.63,y,y+.09,index,height,.32);
  b.plane('frame',face,x-.035,x+.035,10.32,11.60,index,height,.34);
 }
 // Inner dark-glass entry sits BEHIND the old open four-column porch.
 const d0=c-3.35,d1=c+3.35;
 b.plane('door',face,d0,d1,.30,3.85,index,height,.06);
 for(const x of [d0,c-1.22,c,c+1.22,d1])
  b.plane('frame',face,x-.055,x+.055,.30,3.85,index,height,.13);
 b.plane('frame',face,d0,d1,3.80,3.94,index,height,.13);
 // Four shallow steps outside the porch. Their count, lengths and levels
 // are image-derived suggestions, not surveyed or road-aligned.
 for(let i=0;i<4;i++){
  const stepHeight=.18*(4-i),stepDepth=.63;
  const z=a(c,0,1.85+i*.60);
  const g=new THREE.BoxGeometry(9.65,stepHeight,stepDepth);
  g.translate(z[0],baseY+stepHeight*.5,z[2]);b.add('steps',g,index,height);
 }
 return b.finish({
  owner:'src/assets/south/central-one-portico-overlay.js',
  osmIds:[CENTRAL_ONE_ID],modelScope:'portico-detail-overlay-only',
  alreadyExistingFourColumnsReused:true,alreadyExistingMainRoofReused:true,
  entranceOrientation:'north-facing / Z negative',heightsMeasured:false,
  photoProvenance:{school:SCHOOL_PHOTO,overview:[...OVERVIEW_PHOTOS],
   overviewAuthor:'not-individually-verified',imageUsage:'references-only-not-embedded'},
  photoFeatures:['pentagonal-upper-portico-wall','three-small-upper-windows','dark-glass-entrance','entrance-step-treads'],
  inferredFeatures:['upper-gable-height','window-measurements','step-count','surface-colors'],
  sourceDataUnchanged:true,integratorAction:'Add overlay next to existing central buildings group; do not skip old central-one model or duplicate columns',
  front:{center:a(c,6,3.2),normal:[face.nx,face.nz],tangent:[face.ux,face.uz]}
 });
}
