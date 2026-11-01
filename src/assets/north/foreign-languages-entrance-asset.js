import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {labelTexture} from '../../architecture-kit.js';

export const FOREIGN_LANGUAGES_ID=263633896;
const SIGN_LABELS=['外国语学院','国际教育学院'];

// 2023 publicly documented entrance: gray small-format masonry, two vertical
// name placards, wide glass entrance and steps. Image capture date unknown.
// This south-facing OSM segment is a REPLACEABLE orientation assumption.
export function createForeignLanguagesEntranceAsset({
 building,buildingIndex,baseY=1.1,uniforms={},stage='material'
}={}){
 if(building?.osmId!==FOREIGN_LANGUAGES_ID)
  throw Error('Foreign Languages entrance requires OSM 263633896');
 const segments=building.points.slice(1).map((p,i)=>[building.points[i],p])
  .filter(([a,c])=>Math.abs(a[0]-c[0])>70&&Math.abs(a[1]-c[1])<.15)
  .sort((a,c)=>(c[0][1]+c[1][1])-(a[0][1]+a[1][1]));
 const face=segments[0];
 if(!face)throw Error('Foreign Languages long south facade missing from source OSM');
 const x0=Math.min(...face.map(p=>p[0])),x1=Math.max(...face.map(p=>p[0]));
 const center=(x0+x1)/2,front=(face[0][1]+face[1][1])/2;
 const width=24,height=8.0;
 const batch=ownedArchitecture('Foreign Languages / photographed two-college entrance',{
  baseY,uniforms,stage,stoneTileScale:3.5,
  stoneTileOptions:{jointWidth:.035,jointContrast:.15}
 });
 if(!batch.gray){
  batch.materials.stone.color.set('#797979');
  batch.materials.frame.color.set('#afb6b6');
  batch.materials.roof.color.set('#bfc1bd');
  batch.materials.glass.color.set('#70898a');
  batch.materials.dark.color.set('#3f5156');
 }
 if(batch.gray){
  batch.box('stone',center,0,front+.10,22,height,.15,buildingIndex,height);
 }else{
  // Only the photo-visible entrance panel is new. All host building walls,
  // windows, footprint and estimated height remain in the original scene.
  batch.box('stone',center,0,front+.13,width,height,.25,buildingIndex,height);
  batch.box('glass',center,.20,front+.32,17.2,3.65,.12,buildingIndex,height);
  batch.box('glass',center,4.43,front+.32,17.2,1.54,.12,buildingIndex,height);
  // Broad glass doors are divided by thin mullions rather than separate meshes.
  for(let i=0;i<=7;i++){
   const x=center-8.6+i*17.2/7;
   batch.box('frame',x,.18,front+.40,.09,5.92,.10,buildingIndex,height);
  }
  for(const y of [3.94,4.34,5.98])
   batch.box('frame',center,y,front+.40,17.2,.10,.10,buildingIndex,height);
  for(const x of [center-11.0,center+11.0]){
   batch.box('stone',x,.1,front+.37,1.70,7.1,.18,buildingIndex,height);
   batch.box('frame',x,7.28,front+.46,1.58,.18,.15,buildingIndex,height);
  }
  // Photo entrance has shallow wide steps. Treads may need re-positioning
  // after survey: no permanent road/topography edit is made.
  for(let step=0;step<3;step++){
   batch.box('stone',center,.02,front+1.03+step*.72,26.0,.42-step*.11,.68,buildingIndex,height);
  }
  // Low-cost sign supports; canvas glyphs are independently generated when
  // a browser Canvas exists. No photographic bitmap is embedded or republished.
  for(const x of [center-11.0,center+11.0])
   batch.box('frame',x,1.6,front+.53,1.0,5.2,.10,buildingIndex,height);
 }
 const asset=batch.finish({
  owner:'foreign-languages-entrance-asset.js',osmId:FOREIGN_LANGUAGES_ID,
  sourceDataUnchanged:true,signLabels:[...SIGN_LABELS],signPlacards:2,
  geometryBasis:'2023 exterior entrance photograph and unchanged south OSM wing',
  evidenceUrl:'https://ielts.koolearn.com/20230524/859921.html',
  schoolConfirmation:'https://sfs.xjtu.edu.cn/info/1244/8313.htm',
  photoCaptureDate:null,photoPublished:'2023-05-24 (capture date unknown)',
  currentStateVerified:false,facadeOrientationVerified:false,
  assumedFacade:'southern long facade (OSM-local, not a surveyed photograph bearing)',
  photoLicense:'reference only, no source photograph or logo raster reused',
  unknown:'which wing and compass face in the photo, 2026 entry renovations, facade height and step dimensions'
 });
 if(!batch.gray&&typeof document!=='undefined'){
  const textures=[];
  for(const [i,word] of SIGN_LABELS.entries()){
   const t=labelTexture(word,{width:256,height:800,background:'#f6f6f2',color:'#303b44',vertical:true});
   if(!t)continue;
   const sign=new THREE.Mesh(new THREE.PlaneGeometry(.88,4.7),
    new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
   sign.position.set(center+(i===0?-11:11),baseY+4.33,front+.65);
   sign.name='Foreign Languages vertical sign '+word;
   sign.userData.buildingIndex=buildingIndex;sign.userData.owner='foreign-languages-entrance-asset.js';
   asset.add(sign);textures.push(t);
  }
  if(textures.length){
   const release=asset.dispose;let done=false;
   asset.dispose=()=>{if(done)return;done=true;release();textures.forEach(t=>t.dispose());};
  }
 }
 return asset;
}
