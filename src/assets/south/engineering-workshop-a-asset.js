import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {planCells,cellBoundary} from '../../library-asset-plan.js';

export const ENGINEERING_WORKSHOP_A_ID=263633887;
export const ENGINEERING_WORKSHOP_B_ID=264420412;
export const WORKSHOP_A_MAP='https://vi.xjtu.edu.cn/qt/jddt.htm';
export const WORKSHOP_A_PHOTO='https://xjtu.party/photos';
export const WORKSHOP_A_IMAGE='https://static.x-research.com/file/xstatic/www/csweb/photos/engineering-workshop.jpg';

function photoSign(){
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=320;canvas.height=1024;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#444d4e';ctx.fillRect(0,0,320,1024);
 ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.font='bold 110px "Microsoft YaHei",sans-serif';ctx.fillStyle='#f6f5ee';
 for(const [i,ch] of [...'工程坊'].entries())ctx.fillText(ch,160,170+i*225);
 ctx.font='bold 145px Arial,sans-serif';ctx.fillText('A',160,875);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 return texture;
}
export function createEngineeringWorkshopAAsset({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 if(building?.osmId!==ENGINEERING_WORKSHOP_A_ID)throw Error('Expected Xingqing Workshop A OSM 263633887, not Workshop B');
 if(!Number.isInteger(buildingIndex)||buildingIndex<0)throw Error('Missing Workshop A OSM building index');
 const h=building.height,index=buildingIndex,cells=planCells(building.points),edges=cellBoundary(cells);
 // Select the 59.86m northward-facing outer OSM edge as a candidate only.
 // No EXIF camera position, measured elevation, or definitive entrance has been sourced.
 const face=edges.filter(e=>e.length>58&&e.length<62&&e.nz<-.8)[0];
 if(!face)throw Error('Workshop A provisional long facade missing');
 const L=face.length,at=(s,y,offset=0)=>[
  face.a[0]+face.ux*s+face.nx*offset,baseY+y,
  face.a[1]+face.uz*s+face.nz*offset
 ];
 const b=ownedArchitecture('Engineering Workshop A: photo-visible long facade candidate',{
  baseY,uniforms,stage,stoneTileScale:1.4,
  extraMaterials:{
   darkPanel:new THREE.MeshStandardMaterial({color:'#505958',roughness:.78}),
   pale:new THREE.MeshStandardMaterial({color:'#bcc2be',roughness:.83,side:THREE.DoubleSide}),
   charcoal:new THREE.MeshStandardMaterial({color:'#444f50',roughness:.81}),
   signBackground:new THREE.MeshStandardMaterial({color:'#3b4948',roughness:.87}),
  }
 });
 if(!b.gray){
  b.materials.stone.color.set('#626c6b');
  b.materials.roof.color.set('#737977');
  b.materials.glass.color.set('#283d45');
  b.materials.frame.color.set('#303d40');
  b.materials.pale.color.set('#c6c9c7');
 }
 // Undocumented elevations remain charcoal-grey masses. Roof still OSM flat
 // placeholder, not an inferred as-built mechanical floor.
 for(const e of edges)b.plane('stone',e,0,e.length,0,h,index,h);
 b.roof(cells,h,index,h);
 const from=L*.065,to=L*.935;
 // The photograph shows multiple charcoal ribbon windows separated by light
 // horizontal precast strips; width and floor rhythm stay photo-proportional.
 const bands=[[1.45,3.18],[4.68,6.46],[7.88,9.63],[11.15,12.65]];
 for(const [row,[low,high]] of bands.entries()){
  b.plane('glass',face,from,to,low,high,index,h,.105);
  b.plane('pale',face,from-.3,to+.3,high+.07,Math.min(h,high+.44),index,h,.22);
  for(let i=1;i<16;i++){
   const s=from+i*(to-from)/16;
   b.plane('frame',face,s-.060,s+.060,low,high,index,h,.16);
  }
 }
 // Dark central pier with white "工程坊 A" inscription. Photo shows a 4-storey
 // tower-like segment, and one projecting upper structure. The exact edge
 // and real width are unresolved pending frontal/side exterior photos.
 const pierFrom=L*.69,pierTo=L*.87;
 b.plane('charcoal',face,pierFrom,pierTo,0,h,index,h,.36);
 b.plane('signBackground',face,pierFrom+.7,pierTo-.7,3.45,h-.55,index,h,.46);
 // Cantilever held within mapped silhouette, not a real surveyed overhang.
 b.plane('pale',face,L*.03,L*.27,12.50,13.60,index,h,.50);
 const asset=b.finish({
  owner:'src/assets/south/engineering-workshop-a-asset.js',
  osmIds:[ENGINEERING_WORKSHOP_A_ID],
  campusMapSource:WORKSHOP_A_MAP,photoSource:WORKSHOP_A_PHOTO,photoAssetUrl:WORKSHOP_A_IMAGE,
  photographLabel:'工程坊 A',photoType:'dated-unknown-third-party-real-photo',
  photoReuse:'reference-only-not-copied',
  orientationStatus:'provisional-OSM-long-edge',
  heightStatus:'unmeasured-osm-estimate',roofStatus:'OSM-flat-placeholder',
  photoFeatures:['charcoal-concrete-wall','long-black-glazed-ribbon','white-horizontal-spandrel','projecting-upper-volume','vertical-A-sign'],
  unverifiedFeatures:['exact-window-count','photo-camera-position','front-edge-assignment','actual-height','cantilever-dimensions','roof-material'],
  otherWorkshopIdExcluded:ENGINEERING_WORKSHOP_B_ID,
  sourceDataUnchanged:true,geometryStatus:'one long facade photo-informed; other elevations generic',
  front:{center:at(L*.5,7,.5),normal:[face.nx,face.nz],tangent:[face.ux,face.uz]}
 });
 const texture=stage==='massing'?null:photoSign();
 if(texture){
  const geometry=new THREE.PlaneGeometry(Math.min(3.5,(pierTo-pierFrom)*.4),8);
  const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,depthWrite:false});
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.set(...at((pierFrom+pierTo)*.5,8.35,.55));
  mesh.rotation.y=Math.atan2(face.nx,face.nz);
  geometry.setAttribute('buildingIndex',new THREE.Float32BufferAttribute(Array(geometry.attributes.position.count).fill(index),1));
  geometry.setAttribute('assetHeight',new THREE.Float32BufferAttribute(Array(geometry.attributes.position.count).fill(h),1));
  mesh.userData.buildingAssetMesh=true;mesh.userData.owner='src/assets/south/engineering-workshop-a-asset.js';
  mesh.name='Workshop A vertical lettering, orientation candidate';
  asset.add(mesh);
  const dispose=asset.dispose;
  asset.dispose=()=>{dispose();texture.dispose();};
 }
 return asset;
}
