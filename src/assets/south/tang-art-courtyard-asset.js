import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {planCells,cellBoundary} from '../../library-asset-plan.js';

export const TANG_ART_COURTYARD_ID=264420415;
export const TANG_ART_PHOTO='https://news.xjtu.edu.cn/info/1219/221190.htm';
export const TANG_ART_HISTORY='https://news.xjtu.edu.cn/info/1219/143482.htm';

function courtyardEdge(edges){
 // The OSM L has a deep south-facing recess. This is a candidate interior wall,
 // NOT a field-surveyed match to the university group photo.
 return edges.filter(e=>e.length>35)
  .sort((a,b)=>Math.abs((a.a[1]+a.b[1])*.5+93.6)-Math.abs((b.a[1]+b.b[1])*.5+93.6))[0];
}

export function createTangArtCourtyardAsset({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 if(building?.osmId!==TANG_ART_COURTYARD_ID)throw Error('Expected OSM 264420415');
 if(!Number.isInteger(buildingIndex)||buildingIndex<0)throw Error('Invalid Tang courtyard building index');
 const index=buildingIndex,h=building.height;
 const cells=planCells(building.points),edges=cellBoundary(cells),face=courtyardEdge(edges);
 if(!face)throw Error('Courtyard candidate L-face missing');
 const material={
  red:new THREE.MeshStandardMaterial({color:'#803d37',roughness:.67,metalness:.20}),
  sill:new THREE.MeshStandardMaterial({color:'#999991',roughness:.93})
 };
 const batch=ownedArchitecture('Tang Zhongying Art Courtyard — documented historic interior facade',{
  baseY,uniforms,stage,stoneTileScale:1.32,stoneTileOptions:{jointWidth:.013,jointContrast:.085},extraMaterials:material
 });
 if(!batch.gray){
  batch.materials.stone.color.set('#848582');
  batch.materials.glass.color.set('#3e5961');
  batch.materials.roof.color.set('#777a77');
  batch.materials.frame.color.set('#64423c');
  batch.materials.red.color.set('#923b38');
 }
 // Outside and unphotographed edges have material only. Do not invent bay rhythm.
 for(const e of edges)if(e!==face)batch.plane('stone',e,0,e.length,0,h,index,h);
 const L=face.length;
 // Windows in one university group photo: red-grid tall glazing with low
 // grey-brick masonry beside it. Relative placement and window count are illustrative.
 const openings=[
  {from:.10,to:.19,low:2.30,high:4.95,kind:'side'},
  {from:.31,to:.48,low:.85,high:10.3,kind:'tall'},
  {from:.70,to:.79,low:2.30,high:4.95,kind:'side'}
 ].map(o=>({...o,from:o.from*L,to:o.to*L,high:Math.min(o.high,h-.35)}));
 let previous=0;
 for(const o of openings){
  batch.plane('stone',face,previous,o.from,0,h,index,h);
  batch.plane('stone',face,o.from,o.to,0,o.low,index,h);
  batch.plane('glass',face,o.from,o.to,o.low,o.high,index,h,.065);
  batch.plane('stone',face,o.from,o.to,o.high,h,index,h);
  const w=.15; // red steel framing; widths and spacing not measured.
  for(const x of [o.from,o.to]){
   batch.plane('red',face,x-w/2,x+w/2,o.low,o.high,index,h,.115);
  }
  for(const y of [o.low,o.high]){
   batch.plane('red',face,o.from,o.to,y-w/2,y+w/2,index,h,.12);
  }
  const columns=o.kind==='tall'?4:2,rows=o.kind==='tall'?4:2;
  for(let i=1;i<columns;i++){
   const x=o.from+(o.to-o.from)*i/columns;
   batch.plane('red',face,x-.065,x+.065,o.low,o.high,index,h,.12);
  }
  for(let i=1;i<rows;i++){
   const y=o.low+(o.high-o.low)*i/rows;
   batch.plane('red',face,o.from,o.to,y-.075,y+.075,index,h,.12);
  }
  batch.plane('sill',face,o.from,o.to,Math.max(.05,o.low-.12),o.low,index,h,.07);
  previous=o.to;
 }
 batch.plane('stone',face,previous,L,0,h,index,h);
 batch.roof(cells,h,index,h);
 const midpoint=[face.a[0]+face.ux*L*.5,baseY+5,face.a[1]+face.uz*L*.5];
 return batch.finish({
  owner:'src/assets/south/tang-art-courtyard-asset.js',
  osmIds:[TANG_ART_COURTYARD_ID],photoSource:TANG_ART_PHOTO,
  historySource:TANG_ART_HISTORY,photoLicense:'school-owned-reference-only',
  photoKind:'2025-university-event-photo-partial-building-background',
  heightStatus:'unmeasured-osm-estimate',
  facadeOrientationStatus:'provisional-courtyard-facing-l-edge',
  roofStatus:'unknown-flat-placeholder',pondStatus:'not-modeled-no-georeference',
  confirmedFeatures:['grey-brick','deep-red-window-frames','full-height-glazed-bay'],
  inferredFeatures:['window-count','exact-window-dimensions','facade-position','whole-roof-height'],
  sourceDataUnchanged:true,geometryStatus:'partial interior facade only',
  courtyardFacadeLine:L,
  front:{center:midpoint,normal:[face.nx,face.nz],tangent:[face.ux,face.uz]}
 });
}
