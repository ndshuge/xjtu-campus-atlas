import * as THREE from 'three';
import {architectureBatch,stoneMaterial,glassMaterial} from './architecture-kit.js';

export function mainTowerMassing(footprint,height,baseY){
 const [x0,z0,x1,z1]=footprint,w=x1-x0,d=z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2;
 // Actual open portal, not a dark rectangle stuck on a solid box.
 return{bodyHeight:height-18.5,piers:[
  [x0+3.6,baseY+height-18.5,cz,7.2,18.5,d],
  [x1-3.6,baseY+height-18.5,cz,7.2,18.5,d],
  [cx,baseY+height-3.1,cz,w,3.1,d]
 ],portal:{centerX:cx,bottom:baseY+height-18.5,top:baseY+height-3.1,width:w-14.4}};
}
export function createMainTowerFacade({footprint,height,baseY}){
 const [x0,z0,x1,z1]=footprint,cx=(x0+x1)/2,cz=(z0+z1)/2,w=x1-x0,d=z1-z0;
 const b=architectureBatch('Main E / stone frame, glazing and open roof portal',{
  stone:stoneMaterial('#c8bbae'),glass:glassMaterial('#344c5d'),
  frame:new THREE.MeshStandardMaterial({color:'#80898a',metalness:.4,roughness:.48}),
  shade:new THREE.MeshStandardMaterial({color:'#6a6b65',roughness:.85})
 });
 const top=baseY+height-19.0,bottom=baseY+11,glassW=w*.48;
 for(const side of [-1,1]){
  const z=side<0?z0-.13:z1+.13;
  b.box('glass',cx,bottom,z,glassW,top-bottom,.22);
  for(let i=0;i<=6;i++)b.box('frame',cx-glassW/2+i*glassW/6,bottom,z+side*.17,.10,top-bottom,.22);
  for(let y=bottom+2.95;y<top-.5;y+=3.15){
   b.box('stone',cx,y,z+side*.20,glassW,.36,.36);
   b.box('frame',cx,y+.45,z+side*.22,glassW,.08,.18);
  }
  for(const s of [-1,1]){
   b.box('stone',cx+s*(glassW/2+1.2),baseY+1,z+side*.25,1.45,height-3,.70);
   b.box('glass',cx+s*(w/2-3.0),baseY+8.0,z,2.6,height-12,.20);
  }
  b.box('glass',cx,baseY+.9,z+side*.1,17,8.5,.22);
  for(let i=-2;i<=2;i++)b.box('frame',cx+i*3.1,baseY+.8,z+side*.35,.16,8.6,.35);
  b.box('stone',cx,baseY+9.4,z+side*.35,23,.75,1.6);
  b.box('stone',cx,top-.2,z+side*.35,w-4,.8,1.1);
  // Recessed inner portal surfaces and an open balustrade behind the opening.
  b.box('shade',cx,baseY+height-18.2,z-side*1.2,w-13.8,.3,2);
  for(let i=-4;i<=4;i++)b.box('frame',cx+i*2.3,baseY+height-18,z-side*2.0,.10,1.1,.10);
  b.box('frame',cx,baseY+height-16.9,z-side*2.0,20,.10,.12);
 }
 for(const side of [-1,1]){
  const x=side<0?x0-.13:x1+.13;
  for(let i=0;i<7;i++){
   const z=z0+3+(i+.5)*(d-6)/7;
   b.box('glass',x,baseY+8,z,.20,height-12,2.6);
  }
  for(let y=baseY+11;y<baseY+height-4;y+=3.15)b.box('stone',x+side*.12,y,cz,.35,.34,d-3);
 }
 // Lightweight roof trellis observed in the front and aerial references.
 for(let i=0;i<11;i++)b.box('frame',x0+2+i*(w-4)/10,baseY+height-1.20,cz,.18,1.1,d*.92);
 b.box('frame',cx,baseY+height-1.20,z0+1,w-2,.22,.22);
 b.box('frame',cx,baseY+height-1.20,z1-1,w-2,.22,.22);
 const g=b.finish();g.userData={sourceFootprint:'OSM 263624057',referenceDates:['2012-11-06','2025-07-25'],estimated:true,openPortal:true,heightPolicy:'existing 80.5m body estimate; lightweight rooftop detailing, not surveyed'};
 return g;
}
