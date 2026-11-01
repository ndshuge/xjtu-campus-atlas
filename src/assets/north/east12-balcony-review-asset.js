import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';

export const EAST12_ID=264107455;

// Official XJTU logistics summer-2026 report confirms NEW OUTDOOR STEEL
// BALCONIES at East 12. The report does NOT show the precise elevation,
// floors, post layout, dimensions or glazing. This is an intentionally
// non-publishable, orientation-explicit engineering review asset.
export function createEast12BalconyReviewAsset({
 building,buildingIndex,edgeIndex,levels,previewOnly=false,stage='material',
 baseY=1.1,uniforms={}
}={}){
 if(building?.osmId!==EAST12_ID)throw Error('East12 requires OSM way/264107455');
 if(!Number.isInteger(edgeIndex)||!Array.isArray(levels))throw Error('explicit review face and levels are required');
 if(previewOnly!==true)throw Error('previewOnly:true required until photo-confirmed face');
 if(edgeIndex<0||edgeIndex>=building.points.length-1)throw Error('Invalid edgeIndex');
 if(!levels.length||!levels.every(v=>Number.isInteger(v)&&v>=1&&v<=5))throw Error('Invalid levels');
 if(new Set(levels).size!==levels.length)throw Error('Duplicate levels are not allowed');
 const a=building.points[edgeIndex],b=building.points[edgeIndex+1];
 const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
 if(len<10)throw Error('Review edge is too short for this study');
 const ux=dx/len,uz=dz/len;
 const signed=building.points.slice(0,-1).reduce((sum,p,i)=>{
  const q=building.points[i+1];return sum+p[0]*q[1]-q[0]*p[1];
 },0);
 const nx=(signed>=0?1:-1)*uz,nz=(signed>=0?-1:1)*ux;
 const floorHeight=building.height/6; // illustrative only, not surveyed storeys
 const high=Math.max(...levels)*floorHeight+.30;
 const batch=ownedArchitecture('East12 steel-balcony dimensional review / NOT FOR RELEASE',{
  baseY,stage,uniforms
 });
 if(!batch.gray){
  batch.materials.frame.color.set('#606b6d');
  batch.materials.frame.metalness=.55;
  batch.materials.frame.roughness=.5;
  batch.materials.stone.color.set('#858e90');
 }
 // All geometry is placed outside the selected OSM edge by 0.25-2.35m.
 // There is intentionally no facade plaster, color, door, window or glass:
 // the 2026 school report confirms steel balconies, not those details.
 const place=(kind,s,y,offset,length,thickness,depth)=>{
  const box=new THREE.BoxGeometry(length,thickness,depth);
  box.rotateY(-Math.atan2(uz,ux));
  box.translate(a[0]+ux*s+nx*offset,baseY+y,a[1]+uz*s+nz*offset);
  batch.add(kind,box,buildingIndex,building.height);
 };
 const start=3,end=len-3,walk=end-start;
 if(walk<6)throw Error('Review edge has insufficient usable span');
 if(batch.gray){
  place('stone',(start+end)/2,high-.25,1.3,walk,.5,2.05);
 }else{
  const levelYs=levels.map(l=>l*floorHeight+.3);
  for(const y of levelYs){
   place('frame',(start+end)/2,y,1.30,walk,.26,2.1);
   place('frame',(start+end)/2,y+.94,2.28,walk,.085,.10);
  }
  const posts=Math.max(3,Math.round(walk/5));
  for(let i=0;i<=posts;i++){
   const s=start+walk*i/posts;
   place('frame',s,high/2,2.28,.11,high,.11);
   // supports are visibly steel-only; this does not claim a precise
   // built frame grid, number of balconies or actual glass enclosure.
  }
 }
 const asset=batch.finish({
  owner:'east12-balcony-review-asset.js',osmId:EAST12_ID,
  sourceDataUnchanged:true,yearOfConfirmedWork:2026,
  geometryBasis:'2026 university logistics report confirms new exterior steel balconies',
  officialSource:'https://news.xjtu.edu.cn/info/1219/234307.htm',
  tenderSource:'https://365trade.com.cn/jgczb/810241.jhtml',
  photoConfirmedFace:false,currentStateVerified:false,productionReady:false,
  previewOnly:true,levelsActualVerified:false,reviewLevels:[...levels],reviewEdgeIndex:edgeIndex,
  hypotheticalSpan:walk,hypotheticalProjection:2.35,hypotheticalFloorHeight:floorHeight,
  unknown:'actual facade orientation, levels, floor spacing, post cadence, balcony depth, glazing and 2026 real photographs'
 });
 return asset;
}
