import {ownedArchitecture} from '../../building-asset-kit.js';
import {planCells,cellBoundary} from '../../library-asset-plan.js';

export const LIZHI_EAST6_ID=263808681;

// Source: Weisi Dai, 2013-06-02, XJTU East 6 Dorm Building,
// Wikimedia Commons CC BY-SA 3.0; school official history confirms
// glass conservatory Star Space at first-floor EAST end, with 2026 use.
// Entrance compass direction and exact conservatory layout are unknown.
// All modeled shapes remain within the original East6 OSM footprint,
// except a short entrance canopy and accessibility ramp.
export function createLizhiEast6Asset({
 building,buildingIndex,baseY=1.1,uniforms={},stage='material'
}={}){
 if(building?.osmId!==LIZHI_EAST6_ID)throw Error('Lizhi East6 requires OSM way/263808681');
 const height=building.height,rows=6,floor=height/rows;
 const batch=ownedArchitecture('Lizhi College / East6 photo evidence',{
  baseY,uniforms,stage,stoneTileScale:3.5,
  stoneTileOptions:{jointWidth:.024,jointContrast:.10}
 });
 if(!batch.gray){
  batch.materials.stone.color.set('#d8dcda');
  batch.materials.glass.color.set('#6c8389');
  batch.materials.frame.color.set('#bac1c1');
  batch.materials.dark.color.set('#485459');
  batch.materials.roof.color.set('#aeb3b0');
 }
 const cells=planCells(building.points),edges=cellBoundary(cells);
 const entrance=edges.find(e=>e.nz<-.90&&e.length>52);
 const eastEnd=edges.find(e=>e.nx>.9&&e.length>14);
 if(!entrance||!eastEnd)throw Error('East6 OSM long north facade / east head changed');
 if(batch.gray){
  for(const e of edges)batch.plane('stone',e,0,e.length,0,height,buildingIndex,height);
  batch.roof(cells,height,buildingIndex,height);
 }else{
  for(const e of edges){
   if(e===entrance){
    // The 2013 frontage uses broad silver casement windows, not the
    // generic dorm shell's narrow square grid.
    const count=Math.round(e.length/3.85),bay=e.length/count;
    for(let row=1;row<rows;row++){
     const bottom=row*floor,lo=bottom+floor*.28,hi=bottom+floor*.71;
     batch.plane('stone',e,0,e.length,bottom,lo,buildingIndex,height);
     batch.plane('stone',e,0,e.length,hi,bottom+floor,buildingIndex,height);
     for(let k=0;k<count;k++){
      const from=k*bay,to=(k+1)*bay,left=from+bay*.10,right=to-bay*.10;
      batch.plane('stone',e,from,left,lo,hi,buildingIndex,height);
      batch.plane('stone',e,right,to,lo,hi,buildingIndex,height);
      batch.plane('glass',e,left,right,lo,hi,buildingIndex,height,-.09);
      for(const s of [left,left+(right-left)*.52,right])
       batch.plane('frame',e,s-.042,s+.042,lo,hi,buildingIndex,height,.045);
      batch.plane('frame',e,left,right,lo-.05,lo+.05,buildingIndex,height,.045);
      batch.plane('frame',e,left,right,hi-.05,hi+.05,buildingIndex,height,.045);
     }
    }
    const L=e.length,from=L*.58,to=L*.79;
    batch.plane('stone',e,0,from,0,floor,buildingIndex,height);
    batch.plane('stone',e,to,L,0,floor,buildingIndex,height);
    batch.plane('stone',e,from,to,2.94,floor,buildingIndex,height);
    batch.curtain(e,{from:from+.15,to:to-.15,bottom:.08,top:2.80,index:buildingIndex,height,columns:5,rows:2});
    const center=(from+to)/2;
    const cx=e.a[0]+e.ux*center,cz=e.a[1]+e.uz*center;
    // Documentary entrance has a plain silver canopy and a metal ramp.
    batch.box('frame',cx,2.79,cz+e.nz*.84,8.5,.38,1.68,buildingIndex,height);
    const eAt=(s,y,o)=>[e.a[0]+e.ux*s+e.nx*o,baseY+y,e.a[1]+e.uz*s+e.nz*o];
    batch.quad('stone',[
     eAt(from+.48,.10,.12),eAt(to-.48,.10,.12),
     eAt(to-.48,-.44,1.85),eAt(from+.48,-.44,1.85)
    ],buildingIndex,height);
    for(let k=0;k<2;k++){
     const side=k?to-.48:from+.48;
     batch.quad('frame',[
      eAt(side,.18,.15),eAt(side,1.13,.15),
      eAt(side,.62,1.87),eAt(side,-.37,1.87)
     ],buildingIndex,height);
    }
    // Small external AC cases are visible on the 2013 long facade.
    for(let row=1;row<rows;row++)for(const fraction of [.17,.42,.87]){
     const s=L*fraction,x=e.a[0]+e.ux*s,z=e.a[1]+e.uz*s+e.nz*.22;
     const y=row*floor+floor*.77;
     batch.box('frame',x,y,z,.65,.52,.42,buildingIndex,height);
     batch.plane('dark',e,s-.23,s+.23,y+.08,y+.41,buildingIndex,height,.48);
    }
   }else if(e===eastEnd){
    // The official historic article locates Star Space at the EAST head,
    // but provides no measured footprint. Keep the glazing INBOARD:
    // it reads as a first-floor sunroom without claiming an external annex.
    batch.wall(e,{bottom:floor,top:height,rows:rows-1,index:buildingIndex,height,bayWidth:3.2});
    batch.plane('stone',e,0,e.length,3.12,floor,buildingIndex,height);
    batch.plane('stone',e,0,1.7,0,3.12,buildingIndex,height);
    batch.plane('stone',e,e.length-1.7,e.length,0,3.12,buildingIndex,height);
    batch.curtain(e,{from:1.7,to:e.length-1.7,bottom:.08,top:3.12,
      index:buildingIndex,height,columns:5,rows:2});
   }else batch.wall(e,{top:height,rows,index:buildingIndex,height,bayWidth:3.55});
  }
  batch.roof(cells,height,buildingIndex,height);
  // Shallow glazed skylight to identify the sunroom only; NOT a claim
  // of actual roof slope, pitch or the 2026 footprint.
  const eastX=Math.max(...building.points.map(p=>p[0]));
  const z0=Math.min(...building.points.map(p=>p[1]))+3.05;
  const z1=Math.max(...building.points.map(p=>p[1]))-3.05;
  const x0=eastX-4.35,x1=eastX-.12,y=baseY+3.18;
  batch.quad('glass',[[x0,y,z0],[x0,y,z1],[x1,y+.18,z1],[x1,y+.18,z0]],buildingIndex,height);
  for(const z of [z0,(z0+z1)/2,z1]){
   batch.box('frame',(x0+x1)/2,3.20,z,x1-x0,.10,.085,buildingIndex,height);
  }
 }
 return batch.finish({
  owner:'lizhi-east6-asset.js',osmIds:[LIZHI_EAST6_ID],
  currentStateVerified:false,photoTakenAt:'2013-06-02T18:29:39',
  photoUrl:'https://commons.wikimedia.org/wiki/File:XJTU_East_6_Dorm_Building.jpg',
  photoCredit:'Weisi Dai / Multiple1902, CC BY-SA 3.0, source photo is not shipped',
  sourceDataUnchanged:true,hasEntranceRamp:!batch.gray,
  glassRoomFootprintSurveyed:false,
  starSpaceEvidence:'Official 2013-2014 introduction + 2026 activity news',
  eastEndGlazing:'schematic in original OSM envelope, not 2026 survey',
  entranceFace:'north long edge is a tentative photographic orientation',
  unknown:'2026 facade repairs, canopy orientation and size, actual Star Space footprint, roof, floor count'
 });
}
