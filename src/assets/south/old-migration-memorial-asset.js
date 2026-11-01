import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {planCells,cellBoundary} from '../../library-asset-plan.js';

export const OLD_MEMORIAL_ID=264288694;
export const OLD_MEMORIAL_PHOTO='https://cssy.xjtu.edu.cn/info/1121/2460.htm';
export const OLD_MEMORIAL_HISTORY='https://news.xjtu.edu.cn/info/1219/156353.htm';

export function createOldMigrationMemorialAsset({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 if(building?.osmId!==OLD_MEMORIAL_ID)throw Error('Expected old memorial OSM 264288694, not the new four-floor museum');
 if(!Number.isInteger(buildingIndex)||buildingIndex<0)throw Error('Invalid old memorial OSM index');
 const cells=planCells(building.points),edges=cellBoundary(cells),h=Math.min(building.height,8.2),index=buildingIndex;
 // A front edge is selected for INDEPENDENT PREVIEW only. The single way has
 // NOT been matched to the 1956 North Wing or the 1970s South Wing.
 const face=edges.filter(e=>e.length>12)
  .sort((a,b)=>(b.a[1]+b.b[1])-(a.a[1]+a.b[1]))[0];
 if(!face)throw Error('Old museum candidate edge not available');
 const b=ownedArchitecture('Old migration memorial — historical hospital entry photo candidate',{
  baseY,uniforms,stage,stoneTileScale:2.9,
  stoneTileOptions:{jointWidth:.014,jointContrast:.15},
  extraMaterials:{
   redTile:new THREE.MeshStandardMaterial({color:'#8c5041',roughness:.94,side:THREE.DoubleSide}),
   redTimber:new THREE.MeshStandardMaterial({color:'#763a2d',roughness:.84}),
   circleFrame:new THREE.MeshStandardMaterial({color:'#525c55',metalness:.12,roughness:.74,side:THREE.DoubleSide})
  }
 });
 if(!b.gray){
  b.materials.stone.color.set('#858a89');
  b.materials.roof.color.set('#898d8b');
  b.materials.glass.color.set('#a0bfbb');
  b.materials.frame.color.set('#85948b');
  b.materials.redTile.color.set('#904d3c');
 }
 for(const edge of edges)b.plane('stone',edge,0,edge.length,0,h,index,h);
 b.roof(cells,h,index,h); // unknown, flat placeholder from existing OSM
 const c=face.length*.5,photoSpan=Math.min(10,face.length*.76);
 const at=(s,y,o=0)=>[
  face.a[0]+face.ux*s+face.nx*o,
  baseY+y,
  face.a[1]+face.uz*s+face.nz*o
 ];
 // The school image documents a grey masonry, circular-window porch with
 // glass doors, and RED TILED EAVES; it does not document the whole roof.
 const circleS=c+photoSpan*.28,doorFrom=c-photoSpan*.35,doorTo=doorFrom+photoSpan*.31;
 b.plane('glass',face,doorFrom,doorTo,.15,3.07,index,h,.115);
 for(const s of [doorFrom,doorTo,(doorFrom+doorTo)/2]){
  b.plane('frame',face,s-.045,s+.045,.15,3.07,index,h,.16);
 }
 for(const y of [.18,3.06])b.plane('frame',face,doorFrom,doorTo,y-.042,y+.042,index,h,.16);
 const circleY=2.23,circleRadius=Math.min(.83,photoSpan*.11),angle=Math.atan2(face.nx,face.nz);
 function addRound(kind,geometry,s,y,offset){
  geometry.rotateY(angle);geometry.translate(...at(s,y,offset));
  b.add(kind,geometry,index,h);
 }
 addRound('glass',new THREE.CircleGeometry(circleRadius,44),circleS,circleY,.13);
 addRound('circleFrame',new THREE.RingGeometry(circleRadius-.08,circleRadius+.10,44),circleS,circleY,.16);
 // Entry canopy: two small red pitched roof planes, only within photographed
 // porch width. Do not extrapolate a red roof over the mapped entire building.
 const left=c-photoSpan*.5,right=c+photoSpan*.5;
 const back=.10,front=1.75,roofBackY=3.62,roofFrontY=3.37;
 b.quad('redTile',[at(left,roofBackY,back),at(right,roofBackY,back),
  at(right,roofFrontY,front),at(left,roofFrontY,front)],index,h);
 b.quad('redTimber',[at(left,roofFrontY,front),at(right,roofFrontY,front),
  at(right,roofFrontY-.20,front),at(left,roofFrontY-.20,front)],index,h);
 // Subtle tile seams: these are a texture cue, NOT a surveyed count.
 for(let i=1;i<11;i++){
  const s=left+photoSpan*i/11;
  b.quad('redTimber',[at(s-.013,roofBackY+.012,back),at(s+.013,roofBackY+.012,back),
   at(s+.013,roofFrontY+.012,front),at(s-.013,roofFrontY+.012,front)],index,h);
 }
 return b.finish({
  owner:'src/assets/south/old-migration-memorial-asset.js',osmIds:[OLD_MEMORIAL_ID],
  photoSource:OLD_MEMORIAL_PHOTO,historicalSource:OLD_MEMORIAL_HISTORY,
  photoLicense:'school-owned-reference-only',photoDate:'2017 article',
  wingMappingStatus:'UNRESOLVED',facadeOrientationStatus:'provisional-southern-edge',
  heightStatus:'unmeasured-osm-estimate',sourceOsmHeight:building.height,visualTwoStoreyHeight:h,
  relativePhotoOrder:'round-window-left-of-glass-entrance-from-camera',roofStatus:'unknown-flat-placeholder',
  historicalMuseumVsModern:'old hospital two wings, not modern museum 1167525875',
  confirmedFeatures:['grey-brick','round-window','glass-entrance','red-tiled-canopy'],
  inferredFeatures:['door-scale','canopy-width','specific-OSM-wing','candidate-south-edge','circular-window-world-position'],
  sourceDataUnchanged:true,
  historicalGeometryStatus:'old museum pair described in sources; only one existing OSM way decorated as local candidate; two-storey height inferred not measured',
  front:{center:at(c,2.3,1.5),normal:[face.nx,face.nz],tangent:[face.ux,face.uz]}
 });
}
