import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';

export const HOSPITAL_ID=264106102;

// 2022 XJTU News exterior: concrete/ceramic west court entrance,
// pale vertical fins and a recognizable red medical cross.
// This is a reversible historical-reference entry piece, not a surveyed
// current facade or a replacement for the irregular T-shaped OSM building.
export function createCampusHospitalEntryAsset({
 building,buildingIndex,baseY=1.1,uniforms={},stage='material'
}={}){
 if(building?.osmId!==HOSPITAL_ID)throw Error('Campus hospital entrance requires OSM 264106102');
 const side=building.points.slice(1).map((p,i)=>[building.points[i],p])
  .filter(([a,b])=>Math.abs(a[0]-309.65)<.04&&Math.abs(b[0]-309.65)<.04&&Math.abs(a[1]-b[1])>25)[0];
 if(!side)throw Error('Hospital west court recess is not found in OSM polygon');
 const x=(side[0][0]+side[1][0])/2;
 const minZ=Math.min(side[0][1],side[1][1]),maxZ=Math.max(side[0][1],side[1][1]);
 const depthZ=maxZ-minZ;
 const midZ=(minZ+maxZ)/2;
 const h=8.1; // historic 2-level porch photo estimate, not storey survey
 const a=ownedArchitecture('XJTU campus hospital / west-court entrance reference',{baseY,stage,uniforms,
  extraMaterials:{
   cross:new THREE.MeshStandardMaterial({color:'#c32736',roughness:.86,metalness:0})
  }
 });
 if(!a.gray){
  a.materials.stone.color.set('#c1c0b4');
  a.materials.frame.color.set('#d4d4cb');
  a.materials.glass.color.set('#526b74');
  a.materials.dark.color.set('#444e56');
  a.materials.roof.color.set('#949b96');
 }
 // The exterior wall is the western recess of the hospital's T-like
 // original polygon. All added pieces sit outward toward the open courtyard.
 if(a.gray){
  a.box('stone',x-.18,0,midZ,.22,h,depthZ-.5,buildingIndex,building.height);
 }else{
  a.box('stone',x-.14,0,midZ,.20,h,depthZ-.58,buildingIndex,building.height);
  // Ground-floor wide glazing with a central double-door split.
  a.box('glass',x-.30,.10,midZ,.16,3.45,depthZ*.66,buildingIndex,building.height);
  for(const t of [-.5,-.25,0,.25,.5]){
   a.box('frame',x-.395,.07,midZ+t*depthZ*.66,.105,3.50,.13,buildingIndex,building.height);
  }
  a.box('frame',x-.36,3.62,midZ,.11,.17,depthZ*.66,buildingIndex,building.height);
  // White ceramic upper porch and slender horizontal eaves.
  a.box('frame',x-.65,4.44,midZ,1.28,.26,depthZ-.45,buildingIndex,building.height);
  a.box('roof',x-.81,7.75,midZ,1.55,.36,depthZ-.38,buildingIndex,building.height);
  // Vertical sunshade fins seen in archival photo. Their precise count and
  // spacing are conjectural and kept as a single material batch.
  const count=11;
  for(let i=0;i<count;i++){
   const z=minZ+.96+(depthZ-1.92)*i/(count-1);
   a.box('frame',x-.79,4.73,z,.20,2.69,.20,buildingIndex,building.height);
  }
  // The recognizable red cross is a separate 3D symbol, not a copied logo.
  const signZ=minZ+depthZ*.77;
  a.box('cross',x-.60,5.29,signZ,.11,2.05,.55,buildingIndex,building.height);
  a.box('cross',x-.60,5.99,signZ,.11,.55,1.87,buildingIndex,building.height);
  // Small step/ramp at the low entrance; true accessibility grade unknown.
  for(let k=0;k<3;k++){
   a.box('stone',x-.72-k*.54,.02,midZ, .56,.35-k*.08,depthZ*.67,buildingIndex,building.height);
  }
 }
 return a.finish({
  owner:'campus-hospital-entry-asset.js',osmId:HOSPITAL_ID,
  hostOriginalMustRemain:true,sourceDataUnchanged:true,
  historicalSource:'https://news.xjtu.edu.cn/info/1007/187270.htm',
  photoPublished:'2022-09-27',photoCaptureDate:null,
  currentStateVerified:false,entrySideVerified:false,
  assumedWall:'OSM west-facing inner-court wall x≈309.65',
  originalSourceDate:'2022-09-27 school news; capture date unknown',
  evidence:'red cross, low canopy, narrow vertical fins, glazed ground-floor entrance',
  unknown:'2026 exterior, west-court entrance bearing, exact medical signage, step and upper floor dimensions'
 });
}
