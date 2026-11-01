import {ownedArchitecture} from '../../building-asset-kit.js';

export const WENZHI_COURTYARD_IDS=Object.freeze([1288039224,1288039225,1288039226]);
// XJTU campus photo from 2020-09-23 (Wenzhi College civilized campus).
// The U-shaped three-dorm plan is original OSM, not a generic rectangle.
// Photo shows pale tiled corridor facades, continuous light balcony rails,
// dark recessed apertures, and an OPEN planted courtyard.
// Current renovations and precise floor count remain unverified.

const intoCourtyard=(id,e)=>{
 if(id===1288039224)return e.nz>.75&&e.length>20; // West18 north wing / south-facing
 if(id===1288039226)return e.nz<-.75&&e.length>20; // West20 south wing / north-facing
 if(id===1288039225)return e.nx<-.75&&e.length>5; // West19 east spine / west-facing
 return false;
};
export function createWenzhiCourtyardAsset({
 building,buildingIndex,baseY=1.1,uniforms={},stage='material'
}={}){
 const id=building?.osmId;
 if(!WENZHI_COURTYARD_IDS.includes(id))throw Error('Wenzhi courtyard accepts West18/19/20 only');
 const height=building.height,levels=7;
 const batch=ownedArchitecture('Wenzhi courtyard / independent historic dorm '+id,{
  baseY,uniforms,stage,stoneTileScale:3.8,
  stoneTileOptions:{jointWidth:.024,jointContrast:.12}
 });
 if(!batch.gray){
  batch.materials.stone.color.set('#d8dada');
  batch.materials.frame.color.set('#c8d0cf');
  batch.materials.dark.color.set('#39474c');
  batch.materials.glass.color.set('#667b84');
  batch.materials.roof.color.set('#abb2ae');
 }
 const {edges}=batch.shell(building.points,{
  top:height,rows:levels,index:buildingIndex,height,bayWidth:3.25,
  face:e=>!batch.gray&&intoCourtyard(id,e)
 });
 const inner=batch.gray?[]:edges.filter(e=>intoCourtyard(id,e));
 if(!batch.gray)for(const e of inner){
  const floor=height/levels,bays=Math.max(2,Math.floor(e.length/3.4)),bay=e.length/bays;
  const at=(s,y,d)=>[
   e.a[0]+e.ux*s+e.nx*d,baseY+y,
   e.a[1]+e.uz*s+e.nz*d
  ];
  for(let row=0;row<levels;row++){
   const y=row*floor,lo=y+floor*.34,hi=Math.min(height-.1,y+floor*.83);
   batch.plane('stone',e,0,e.length,y,lo,buildingIndex,height);
   batch.plane('stone',e,0,e.length,hi,y+floor,buildingIndex,height);
   for(let k=0;k<bays;k++){
    const from=k*bay,to=(k+1)*bay,l=from+bay*.16,r=to-bay*.16;
    batch.plane('stone',e,from,l,lo,hi,buildingIndex,height);
    batch.plane('stone',e,r,to,lo,hi,buildingIndex,height);
    batch.plane('dark',e,l,r,lo,hi,buildingIndex,height,-.10);
   }
   // Each balcony slab is a lightweight single quad plus an opaque rail
   // face, not one Three.js mesh per dorm window.
   const yy=y+floor*.27;
   batch.quad('frame',[at(0,yy,.035),at(0,yy,.48),
    at(e.length,yy,.48),at(e.length,yy,.035)],buildingIndex,height);
   batch.plane('frame',e,0,e.length,yy,yy+.28,buildingIndex,height,.49);
   batch.plane('frame',e,0,e.length,yy+.74,yy+.88,buildingIndex,height,.48);
   for(let j=0;j<=bays;j++){
    const s=j*bay;
    batch.plane('frame',e,Math.max(0,s-.043),Math.min(e.length,s+.043),
     yy+.28,yy+.74,buildingIndex,height,.49);
   }
  }
 }
 return batch.finish({
  owner:'wenzhi-courtyard-asset.js',osmIds:[id],
  sourceDataUnchanged:true,currentStateVerified:false,
  photoEvidenceYear:2020,photoCaptureDate:null,
  courtyardBalconyEdges:inner.length,outwardFaceConfirmed:false,
  evidenceUrl:'https://news.xjtu.edu.cn/info/1008/122849.htm',
  evidenceDetail:'2020-09-23 school article photo: open U courtyard, pale balcony bands and recessed openings',
  geometryBasis:'OSM three independent ways; photo-guided inward facades only',
  photoLicense:'school photo used for reference only; no external texture shipped',
  unknown:'storeys, current 2026 balcony closures, actual facade orientation/renovation, entrances, west wall details'
 });
}
