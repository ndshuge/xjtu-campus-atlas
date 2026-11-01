import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {planCells,cellBoundary} from '../../library-asset-plan.js';

export const SPORTS_CENTER_OSM_ID=264108763;
export const SPORTS_CENTER_OFFICIAL_PHOTO='https://www.xjtu.edu.cn/xxfw/ydcg.htm';
export const SPORTS_CENTER_THIRD_PARTY='https://xjtu.party/photos';

export function createSportsEducationCenterAsset({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 if(building?.osmId!==SPORTS_CENTER_OSM_ID)throw Error('Expected XJTU sports center OSM 264108763');
 if(!Number.isInteger(buildingIndex)||buildingIndex<0)throw Error('Invalid sports center OSM index');
 const index=buildingIndex,h=building.height,cells=planCells(building.points),edges=cellBoundary(cells);
 const front=edges.filter(e=>e.length>25&&e.length<32)
   .sort((a,b)=>Math.abs((a.a[1]+a.b[1])*.5+11.26)-Math.abs((b.a[1]+b.b[1])*.5+11.26))[0];
 if(!front)throw Error('Missing central 29m interior courtyard edge');
 const L=front.length,mid=L*.5,at=(s,y,o=0)=>[
  front.a[0]+front.ux*s+front.nx*o,baseY+y,front.a[1]+front.uz*s+front.nz*o
 ];
 const b=ownedArchitecture('XJTU sports education center — horizontal louver courtyard candidate',{
  baseY,uniforms,stage,stoneTileScale:1.15,
  extraMaterials:{
   darkPanel:new THREE.MeshStandardMaterial({color:'#374242',roughness:.64,metalness:.15,side:THREE.DoubleSide}),
   louver:new THREE.MeshStandardMaterial({color:'#514b44',roughness:.59,metalness:.32,side:THREE.DoubleSide}),
   concrete:new THREE.MeshStandardMaterial({color:'#d1d3cd',roughness:.90,side:THREE.DoubleSide}),
   railing:new THREE.MeshStandardMaterial({color:'#a1b2b0',roughness:.38,metalness:.50,side:THREE.DoubleSide}),
   steps:new THREE.MeshStandardMaterial({color:'#adb0ac',roughness:.94,side:THREE.DoubleSide})
  }});
 if(!b.gray){
  b.materials.stone.color.set('#707a7a');
  b.materials.glass.color.set('#3f555e');b.materials.glass.side=THREE.DoubleSide;
  b.materials.frame.color.set('#b3c2c1');b.materials.roof.color.set('#838888');
 }
 const addBox=(kind,s,y,o,width,height,depth)=>{
  const g=new THREE.BoxGeometry(width,height,depth);
  g.rotateY(-Math.atan2(front.uz,front.ux));
  g.translate(...at(s,y,o));
  b.add(kind,g,index,h);
 };
 // Keep public OSM footprint unmodified. No guessed curtain wall on other sides.
 for(const e of edges)if(e!==front)b.plane('stone',e,0,e.length,0,h,index,h);
 b.plane('stone',front,0,L,0,h,index,h);
 b.roof(cells,h,index,h);
 // Photo-grounded lower glazed wall and white columned piloti in courtyard.
 const glassFrom=L*.08,glassTo=L*.92;
 b.plane('glass',front,glassFrom,glassTo,.38,6.00,index,h,.12);
 for(let i=0;i<=8;i++){
  const s=glassFrom+(glassTo-glassFrom)*i/8;
  b.plane('frame',front,s-.075,s+.075,.38,6.10,index,h,.16);
 }
 b.plane('frame',front,glassFrom,glassTo,3.20,3.32,index,h,.17);
 for(const s of [L*.13,L*.42,L*.72,L*.9]){
  addBox('concrete',s,3.15,2.1,.63,6.3,.63);
 }
 // Photograph: an extended cantilever of many closely spaced dark brown
 // horizontal brise-soleil rails over the second-floor glass, with a louver
 // wrapping a central balcony. Count/offset is an interpretive approximation.
 b.plane('glass',front,L*.04,L*.96,6.10,12.45,index,h,.11);
 const finsCount=20;
 for(let i=0;i<finsCount;i++){
  const y=6.35+i*(5.55/(finsCount-1));
  addBox('louver',mid,y,2.00,L*.98,.11,.28);
 }
 // Balcony slab, second-floor glazed parapet and horizontal metal guardrails.
 addBox('concrete',mid,6.12,2.2,L*.94,.32,4.0);
 for(const y of [6.75,7.14,7.50]){
  addBox('railing',mid,y,4.18,L*.94,.058,.055);
 }
 for(let s=L*.075;s<=L*.92;s+=2.8){
  addBox('railing',s,7.17,4.18,.07,1.1,.07);
 }
 // Top-level open pergola shown in official and third-party photos:
 // white concrete roof beams spanning the open balcony; they are NOT
 // a surveyed third-storey footprint or exact number of beams.
 addBox('concrete',mid,15.55,1.2,L*.93,.46,.8);
 for(let i=0;i<9;i++){
  const s=L*.07+i*(L*.86/8);
  addBox('concrete',s,14.95,2.9,.46,.56,5.8);
 }
 // External main staircase: successive low ramps/steps face the courtyard,
 // no invented street-level vehicular entrances or full sports hall interior.
 const stepsCount=10;
 const stepsWidth=L*.74,depth=.76;
 const stepTopHeightsM=Array.from({length:stepsCount},(_,i)=>Number(((stepsCount-i)*.19).toFixed(2)));
 for(let i=0;i<stepsCount;i++){
  const t=stepTopHeightsM[i];
  addBox('steps',mid,t*.5,4.7+i*.72,stepsWidth,t,depth);
 }
 // Stair handrails rise toward lobby; dimension is photo-proportional only.
 for(const s of [L*.11,L*.89]){
  const side=s===L*.11?1:-1;
  for(let i=0;i<9;i++){
   const y=.25+i*.20;
   addBox('railing',s,y+.34,4.2+i*.74,.065,.72,.065);
  }
  const a=at(s,.95,4.1),z=at(s,2.48,10.65);
  const dir=new THREE.Vector3(z[0]-a[0],z[1]-a[1],z[2]-a[2]);
  const g=new THREE.CylinderGeometry(.045,.045,dir.length(),7);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize()));
  g.translate((a[0]+z[0])/2,(a[1]+z[1])/2,(a[2]+z[2])/2);
  b.add('railing',g,index,h);
 }
 return b.finish({
  owner:'src/assets/south/sports-education-center-asset.js',osmIds:[SPORTS_CENTER_OSM_ID],
  photoSource:SPORTS_CENTER_OFFICIAL_PHOTO,
  comparisonSource:SPORTS_CENTER_THIRD_PARTY,
  photoType:'XJTU-official-partial-courtyard-photo',
  photoLicense:'unlicensed-official-reference-not-copied',
  otherStructureExcluded:'思源学生活动中心',
  heightStatus:'unmeasured-osm-estimate',
  entranceAzimuthStatus:'provisional-internal-courtyard-edge',roofStatus:'unknown-flat-placeholder',
  confirmedFeatures:['horizontal-metal-fins','two-storey-dark-glass','concrete-pergola','broad-stairway','steel-railing'],
  inferredFeatures:['OSM-edge-identity','louver-count','step-count','pergola-spacing','slab-dimensions','roof-form'],
  finsCount,stepsCount,stepTopHeightsM,sourceHeightM:building.height,
  sourceDataUnchanged:true,geometryStatus:'photo-constrained inner court only; outer elevations schematic',
  front:{center:at(mid,8.5,2.0),normal:[front.nx,front.nz],tangent:[front.ux,front.uz]}
 });
}
