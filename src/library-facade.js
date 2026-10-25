import * as THREE from 'three';
import {boxGeometry} from './geo.js';
import {architectureBatch,stoneMaterial,glassMaterial,labelTexture} from './architecture-kit.js';

// Photo-informed proportions, not measured dimensions. Keep OSM perimeter and
// the university's 49.75 m maximum. The aerial reference was captured in 2025.
export const LIBRARY_TIERS=[
 {w:85,d:35,h:7,glass:16.6},{w:68,d:31,h:13,glass:15.6},
 {w:49,d:28,h:20,glass:15},{w:32,d:25,h:26,glass:13.5},
 {w:17,d:20,h:29.75,glass:0}
];
export function createLibraryFacade({centerX,stairFrontZ,steppedCenterZ,baseY,footprint=[]}){
 const mat={glass:glassMaterial('#344d59'),mullion:new THREE.MeshStandardMaterial({color:'#59646a',metalness:.35,roughness:.48}),stone:stoneMaterial('#cfbfae'),roof:stoneMaterial('#a79e92'),steps:stoneMaterial('#b2afa7')};
 const b=architectureBatch('Library / photo-informed stone and window bays',mat);
 let previous=0;
 for(const tier of LIBRARY_TIERS){
  const bottom=baseY+13+previous,top=baseY+13+tier.h,visible=tier.h-previous;
  const front=steppedCenterZ+tier.d/2+.13,glassW=tier.glass;
  if(glassW){
   b.box('glass',centerX,bottom+.08,front,glassW,visible-.18,.18);
   for(let i=0;i<=6;i++)b.box('mullion',centerX-glassW/2+i*glassW/6,bottom,front+.14,.10,visible,.16);
   for(let y=bottom+2.8;y<top-.5;y+=3.1)b.box('mullion',centerX,y,front+.14,glassW,.11,.16);
  }
  // Paired vertical glazing and stone spandrels replace generic square windows.
  const rows=Math.max(1,Math.round(visible/3.1));
  for(let row=0;row<rows;row++){
   const y=bottom+.4+row*visible/rows,h=Math.max(.7,visible/rows-.9);
   for(let x=-tier.w/2+2;x<tier.w/2-1;x+=3.55){
    if(glassW&&Math.abs(x)<glassW/2+1.6)continue;
    for(const offset of [-.48,.48])b.box('glass',centerX+x+offset,y,front,.70,h,.16);
    b.box('stone',centerX+x,y-.13,front+.08,2.55,.18,.28);
   }
   for(const side of [-1,1])for(let z=-tier.d/2+2.2;z<tier.d/2-1;z+=3.55)
    b.box('glass',centerX+side*(tier.w/2+.12),y,steppedCenterZ+z,.16,h,1.8);
  }
  b.box('roof',centerX,top-.20,front-.08,tier.w+.12,.22,.60);
  for(const side of [-1,1])b.box('roof',centerX+side*(tier.w/2-.14),top-.20,steppedCenterZ,.35,.22,tier.d);
  previous=tier.h;
 }
 // Regular fenestration follows the actual OSM north/side-wing perimeter.
 for(let i=1;i<footprint.length;i++){
  const a=footprint[i-1],c=footprint[i],dx=c[0]-a[0],dz=c[1]-a[1],len=Math.hypot(dx,dz);
  if(len<7)continue;
  const bays=Math.max(1,Math.floor(len/3.2)),angle=-Math.atan2(dz,dx);
  for(let bay=0;bay<bays;bay++)for(let row=0;row<3;row++){
   const t=(bay+.5)/bays,x=a[0]+dx*t,z=a[1]+dz*t;
   const geo=boxGeometry(0,baseY+2.1+row*3.35,0,1.65,2.45,.22);
   geo.rotateY(angle);geo.translate(x,0,z);b.add('glass',geo);
  }
 }
 const front=stairFrontZ+.20;
 b.box('glass',centerX,baseY+.6,front,27.6,9.6,.22);
 for(let i=-7;i<=7;i++)b.box('mullion',centerX+i*1.92,baseY+.55,front+.16,.11,9.7,.18);
 for(let y=3.8;y<=9.6;y+=2.9)b.box('mullion',centerX,baseY+y,front+.16,28,.11,.18);
 for(const side of [-1,1])b.box('stone',centerX+side*14.7,baseY,front+.15,1.25,11.1,.85);
 b.box('stone',centerX,baseY+10.25,front+.12,31,2.25,.75);
 b.box('roof',centerX,baseY+12.4,front+.25,32,.38,1.05);
 for(let i=0;i<7;i++)b.box('steps',centerX,baseY-.02,front+1.0+i*.85,33-i*.18,.16+(6-i)*.13,.88);
 const group=b.finish();
 const sign=labelTexture('钱学森图书馆',{background:'#cbbfb0',color:'#222a2c'});
 if(sign){const plaque=new THREE.Mesh(new THREE.PlaneGeometry(26,1.8),new THREE.MeshStandardMaterial({map:sign,roughness:.8}));plaque.position.set(centerX,baseY+11.4,front+.52);plaque.name='Library name / typographic approximation';group.add(plaque);}
 group.userData={sourceFootprint:'OSM 263624481',referenceDates:['2021-09-06','2025-07-25'],estimated:true,maxHeightPolicy:'49.75 m university document; tier dimensions inferred'};
 return group;
}
