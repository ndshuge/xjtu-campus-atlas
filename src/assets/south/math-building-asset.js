import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {planCells,cellBoundary} from '../../library-asset-plan.js';

export const MATH_BUILDING_ID=263625090;
export const MATH_LAB_ID=1219695761; // A distinct, much smaller OSM polygon. Never merge.
export const MATH_PHOTO_01='https://commons.wikimedia.org/wiki/File:西交兴庆之数学楼_01.png';
export const MATH_PHOTO_02='https://commons.wikimedia.org/wiki/File:西交兴庆之数学楼_02.png';

function mathSignTexture(){
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=900;c.height=200;
 const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);
 g.fillStyle='#e5bf73';g.font='bold 130px "Microsoft YaHei",serif';
 g.textAlign='center';g.textBaseline='middle';g.fillText('数学楼',450,104,800);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
export function createMathBuildingAsset({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 if(building?.osmId!==MATH_BUILDING_ID)throw Error('Expected 263625090 large mathematics building, not lab 1219695761');
 if(!Number.isInteger(buildingIndex)||buildingIndex<0)throw Error('Missing math-building OSM index');
 const index=buildingIndex,sourceH=building.height,bodyH=Math.min(sourceH-2.5,11.5),peak=sourceH;
 const cells=planCells(building.points),edges=cellBoundary(cells);
 const longEdges=edges.filter(e=>e.length>50);
 const face=longEdges.sort((a,b)=>(a.a[1]+a.b[1])-(b.a[1]+b.b[1]))[0];
 if(!face)throw Error('Cannot resolve original 89m math-building long side');
 const L=face.length,c=L*.5;
 const xs=building.points.map(p=>p[0]),zs=building.points.map(p=>p[1]);
 const depth=Math.max(...zs)-Math.min(...zs);
 const at=(s,y,out=0)=>[
  face.a[0]+face.ux*s+face.nx*out,
  baseY+y,
  face.a[1]+face.uz*s+face.nz*out
 ];
 const b=ownedArchitecture('Mathematics Building 2025 licensed photo candidate',{baseY,uniforms,stage,stoneTileScale:1.9,
  extraMaterials:{
   red:new THREE.MeshStandardMaterial({color:'#803d3e',metalness:.14,roughness:.78}),
   redTile:new THREE.MeshStandardMaterial({color:'#914c40',roughness:.95,side:THREE.DoubleSide}),
   portal:new THREE.MeshStandardMaterial({color:'#9da19e',roughness:.90}),
   tiledRidge:new THREE.MeshStandardMaterial({color:'#764138',roughness:.95})
  }});
 if(!b.gray){
  b.materials.stone.color.set('#858785');
  b.materials.red.color.set('#87413e');
  b.materials.glass.color.set('#4e6270');
  b.materials.portal.color.set('#a8aba7');
  b.materials.redTile.color.set('#995445');
 }
 // Photo confirms 3 storeys in the central view; unphotographed wings have
 // masonry mass ONLY, avoiding invented windows and laboratory signage.
 for(const e of edges)b.plane('stone',e,0,e.length,0,bodyH,index,sourceH);
 // Double sloping red tile roof inferred from 2025 photo 02.
 // Ridge and exact pitch are NOT surveyed; the original OSM height is a guess.
 b.quad('redTile',[at(0,bodyH,0),at(0,peak,-depth*.5),at(L,peak,-depth*.5),at(L,bodyH,0)],index,sourceH);
 b.quad('redTile',[at(0,peak,-depth*.5),at(0,bodyH,-depth),at(L,bodyH,-depth),at(L,peak,-depth*.5)],index,sourceH);
 // Low-frequency visible roof seams, an illustrative material cue, not real tile count.
 for(let k=1;k<32;k++){
  const s=L*k/32;
  b.quad('tiledRidge',[at(s-.018,bodyH+.03,0),at(s-.018,peak+.03,-depth*.5),
   at(s+.018,peak+.03,-depth*.5),at(s+.018,bodyH+.03,0)],index,sourceH);
 }
 // The two Commons photographs show a recessed stone-columned entrance
 // with red-framed doors, a horizontal canopy/lintel, and upper red windows.
 const portalFrom=c-5.3,portalTo=c+5.3;
 b.plane('portal',face,portalFrom,portalFrom+.58,0,7.3,index,sourceH,.20);
 b.plane('portal',face,portalTo-.58,portalTo,0,7.3,index,sourceH,.20);
 for(const s of [c-1.7,c+1.7])b.plane('portal',face,s-.31,s+.31,0,7.3,index,sourceH,.19);
 b.plane('portal',face,portalFrom,portalTo,4.10,4.58,index,sourceH,.23);
 // Second level behind the columned portico is glazed in both 2025 photos.
 b.plane('glass',face,c-3.05,c+3.05,4.83,7.06,index,sourceH,.17);
 for(const x of [c-3.05,c-1.08,c+1.08,c+3.05])b.plane('red',face,x-.065,x+.065,4.82,7.08,index,sourceH,.24);
 b.plane('red',face,c-3.05,c+3.05,6.14,6.24,index,sourceH,.25);
 b.plane('glass',face,c-3.0,c+3.0,.18,3.12,index,sourceH,.15);
 for(const s of [c-3.05,c-1.10,c+1.10,c+3.05])
  b.plane('red',face,s-.07,s+.07,.17,3.18,index,sourceH,.25);
 b.plane('red',face,c-3.04,c+3.04,3.06,3.18,index,sourceH,.25);
 // Entrance-adjacent second/third level window cues; no implied measured bay counts.
 for(const centerS of [c-16,c-12,c-8,c+8,c+12,c+16]){
  for(const [lo,hi] of [[5.15,7.25],[8.38,10.30]]){
   const from=centerS-1.03,to=centerS+1.03;
   b.plane('red',face,from,to,lo,hi,index,sourceH,.07);
   b.plane('glass',face,from+.10,to-.10,lo+.10,hi-.11,index,sourceH,.13);
   b.plane('red',face,centerS-.06,centerS+.06,lo+.11,hi-.11,index,sourceH,.17);
  }
 }
 const model=b.finish({owner:'src/assets/south/math-building-asset.js',osmIds:[MATH_BUILDING_ID],
  photoSources:[MATH_PHOTO_01,MATH_PHOTO_02],photoAuthor:'Liuxingy',
  photoLicense:'CC BY-SA 4.0',photoDate:'2025-07-25',
  sourceCampus:'Xingqing',photoToOsmStatus:'PROBABLE_NOT_FIELD_VERIFIED',
  heightStatus:'unmeasured-osm-estimate',sourceOsmHeightM:sourceH,
  wallBodyHeightM:bodyH,roofRidgeHeightM:peak,
  roofPitchStatus:'photo-confirmed-pitched-shape-dimensions-inferred',
  facadeOrientationStatus:'provisional-north-long-edge',
  confirmedFeatures:['grey-masonry','red-window-frames','stone-columned-portal','red-tile-pitched-roof','gold-math-building-inscription','upper-portico-glazing'],
  inferredFeatures:['which-OSM-long-edge-is-photo-front','roof-height-and-pitch','exact-window-count','entry-column-width'],
  sourceDataUnchanged:true,
  identityWarning:'Large mathematics building way/263625090 only; not smaller teaching laboratory way/1219695761',
  front:{center:at(c,4.4,.45),normal:[face.nx,face.nz],tangent:[face.ux,face.uz]}
 });
 const texture=stage==='massing'?null:mathSignTexture();
 if(texture){
  const geometry=new THREE.PlaneGeometry(4.6,.99);
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,depthWrite:false});
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(...at(c,3.66,.37));mesh.rotation.y=Math.atan2(face.nx,face.nz);
  geometry.setAttribute('buildingIndex',new THREE.Float32BufferAttribute(Array(geometry.attributes.position.count).fill(index),1));
  geometry.setAttribute('assetHeight',new THREE.Float32BufferAttribute(Array(geometry.attributes.position.count).fill(sourceH),1));
  mesh.name='Math Building gold entrance name — Commons view';mesh.userData.buildingAssetMesh=true;
  mesh.userData.owner='src/assets/south/math-building-asset.js';model.add(mesh);
  const dispose=model.dispose;model.dispose=()=>{dispose();texture.dispose();};
 }
 return model;
}
