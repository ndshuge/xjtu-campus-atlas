import {ownedArchitecture} from '../../building-asset-kit.js';

export const LIZHI_EAST6_ID=263808681;

// Official 2014 story describes a one-storey glazed sunroom at the EAST end
// of Lizhi College, built in 2013. Reports in 2026 still hold meetings there.
// It does not document the exact facade/roof dimensions or 2026 exterior.
// This is a small, easily removable addition to the pre-existing East6 dorm.
export function createLizhiStarspaceAsset({
 dorm,buildingIndex,baseY=1.1,uniforms={},stage='material'
}={}){
 if(dorm?.osmId!==LIZHI_EAST6_ID)throw Error('Lizhi starspace requires East6 OSM 263808681');
 const east=Math.max(...dorm.points.map(p=>p[0]));
 const north=Math.min(...dorm.points.map(p=>p[1]));
 const south=Math.max(...dorm.points.map(p=>p[1]));
 const centerZ=(north+south)/2;
 const west=east-.35,width=5.85,eastWall=west+width;
 const depth=Math.min(10.6,(south-north)-2.5);
 const half=depth/2,low=centerZ-half,high=centerZ+half;
 const top=4.50; // unsurveyed height, clearly one storey below 21 m dorm
 const batch=ownedArchitecture('Lizhi East6 / Starspace 2014 glazed sunroom',{
  baseY,stage,uniforms,stoneTileScale:1.4
 });
 if(!batch.gray){
  batch.materials.stone.color.set('#c9c8c1');
  batch.materials.roof.color.set('#b3b9b4');
  batch.materials.glass.color.set('#698f94');
  batch.materials.glass.transparent=true;
  batch.materials.glass.opacity=.48;
  batch.materials.glass.depthWrite=false;
  batch.materials.glass.side=2; // thin sunroom glazing, visible from both sides
  batch.materials.frame.color.set('#c4c9c6');
  batch.materials.dark.color.set('#40585c');
 }
 if(batch.gray){
  batch.box('stone',(west+eastWall)/2,.08,centerZ,width,top,depth,buildingIndex,top);
 }else{
  // Glass curtain walls are thin panels, NOT a huge opaque cuboid.
  batch.box('stone',(west+eastWall)/2,0,centerZ,width,.21,depth,buildingIndex,top);
  batch.box('glass',eastWall-.075,.20,centerZ,.13,top-.36,depth-.20,buildingIndex,top);
  for(const z of [low+.03,high-.03]){
   batch.box('glass',(west+eastWall)/2,.20,z,width-.12,top-.36,.10,buildingIndex,top);
  }
  // Roof is mostly glazed; beams preserve the photographed glass structure.
  batch.box('glass',(west+eastWall)/2,top-.08,centerZ,width,.12,depth,buildingIndex,top);
  for(const z of [low,high]){
   batch.box('frame',(west+eastWall)/2,.16,z,width+.08,top-.11,.115,buildingIndex,top);
  }
  for(let i=0;i<=5;i++){
   const z=low+(depth*i/5);
   batch.box('frame',eastWall-.02,.18,z,.20,top-.20,.105,buildingIndex,top);
   batch.box('frame',(west+eastWall)/2,top-.02,z,width,.11,.10,buildingIndex,top);
  }
  for(const x of [west+.08,eastWall-.05]){
   for(const z of [low+.08,high-.08]){
    batch.box('frame',x,.18,z,.12,top-.20,.15,buildingIndex,top);
   }
  }
  // A small, readable doorway on the outer end; unverified exact location.
  batch.box('frame',eastWall+.02,.13,centerZ,.12,2.90,.13,buildingIndex,top);
  batch.box('dark',eastWall+.09,.98,centerZ,.07,.08,2.15,buildingIndex,top);
 }
 return batch.finish({
  owner:'lizhi-starspace-asset.js',
  osmIds:[LIZHI_EAST6_ID],livingBuildingOsMId:LIZHI_EAST6_ID,
  buildingIndex,geometryBasis:'2014 official sunroom description + OSM east dorm end',
  locationBasis:'one-storey east end',photoPeriod:'2014 archival exterior; 2026 venue activity confirmation',
  sourceDataUnchanged:true,currentStateVerified:false,photoCaptureDate:null,
  estimatedWidth:width,estimatedDepth:depth,estimatedHeight:top,
  evidenceUrl:'https://news.xjtu.edu.cn/info/1033/18029.htm',
  currentUseSource:'https://news.xjtu.edu.cn/info/1008/231741.htm',
  photoLicense:'reference only / no source photograph reused',
  unknown:'2026 glass envelope, exact end projection, actual dimensions, door side and roof frame spacing'
 });
}
