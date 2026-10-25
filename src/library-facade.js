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
 const mat={glass:glassMaterial('#557f95'),mullion:new THREE.MeshStandardMaterial({color:'#59646a',metalness:.35,roughness:.48}),stone:stoneMaterial('#cfbfae'),roof:stoneMaterial('#a79e92'),steps:stoneMaterial('#b2afa7')};
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
 // University entrance photographs (2016/2024) show a broad glass atrium
 // beneath a continuous band carrying the calligraphic library name,
 // not merely the narrow 28-metre glass strip of the previous model.
 // Approximate dimensions; photo-informed only, never a building survey.
 const atriumWidth=65.6,atriumHeight=12.4,glassFront=front+1.24;
 b.box('glass',centerX,baseY+.12,glassFront,atriumWidth-.9,atriumHeight-.3,.28);
 for(let bay=-9;bay<=9;bay++){
  const bx=centerX+bay*3.56;
  b.box('mullion',bx,baseY+.11,glassFront+.21,.115,atriumHeight-.06,.24);
 }
 for(let row=1;row<5;row++)b.box('mullion',centerX,baseY+row*2.55,glassFront+.22,atriumWidth-.55,.12,.26);
 for(const side of [-1,1]){
  b.box('stone',centerX+side*33.65,baseY+.11,glassFront-.07,1.42,atriumHeight,1.58);
  b.box('mullion',centerX+side*7.0,baseY+2.14,glassFront+.34,.24,4.28,.35);
 }
 b.box('stone',centerX,baseY+12.53,glassFront+.08,67,2.04,1.15);
 b.box('roof',centerX,baseY+13.63,glassFront-.13,68,.41,2.5);
 // The projecting vestibule remains subordinate to the wide glass facade.
 b.box('glass',centerX,baseY+.13,glassFront+.57,14.7,5.24,.28);
 for(let i=-3;i<=3;i++)b.box('mullion',centerX+i*2.42,baseY+.14,glassFront+.82,.13,5.21,.18);
 b.box('mullion',centerX,baseY+4.62,glassFront+.83,15,.13,.18);
 b.box('roof',centerX,baseY+5.66,glassFront+.37,16.9,.33,1.76);
 // Entry steps and a genuine clear central footpath to the circular court.
 for(let i=0;i<6;i++)
  b.box('steps',centerX,baseY-.02,front+3.0+i*.87,31.5-i*.45,.15+(5-i)*.12,.89);
 b.box('roof',centerX,baseY+.08,front+2.1,23.8,.16,1.25);
 const group=b.finish();
 const sign=labelTexture('钱学森图书馆',{background:'#cbbfb0',color:'#222a2c'});
 if(sign){const plaque=new THREE.Mesh(new THREE.PlaneGeometry(26,1.8),new THREE.MeshStandardMaterial({map:sign,roughness:.8}));plaque.position.set(centerX,baseY+12.52,glassFront+.77);plaque.name='Library name on wide entry fascia / typographic approximation';group.add(plaque);}
 group.userData={sourceFootprint:'OSM 263624481',referenceDates:['2021-09-06','2025-07-25'],estimated:true,maxHeightPolicy:'49.75 m university document; tier dimensions inferred'};
 return group;
}
