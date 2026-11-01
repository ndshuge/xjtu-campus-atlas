import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {planCells,cellBoundary} from '../../library-asset-plan.js';

export const EAST_ONE_ID=263625677;
export const INSULATION_BUILDING_ID=264414271;
export const EAST_ONE_PHOTO='https://commons.wikimedia.org/wiki/File:西安交通大学兴庆校区电气工程学院.jpg';
export const EAST_ONE_SCHOOL='https://ee.xjtu.edu.cn/lxwm.htm';

function inscriptionTexture(){
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=220;canvas.height=1024;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#ddd8cb';ctx.fillRect(0,0,220,1024);
 ctx.fillStyle='#24343c';ctx.font='bold 90px "Microsoft YaHei",serif';
 ctx.textAlign='center';ctx.textBaseline='middle';
 for(const [i,ch] of [...'电气工程学院'].entries())ctx.fillText(ch,110,(i+.5)*1024/6);
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
 return t;
}

export function createEastOneEntranceOverlay({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 if(building?.osmId!==EAST_ONE_ID)throw Error('Expected East One electrical college OSM 263625677, NOT electric insulation building');
 if(!Number.isInteger(buildingIndex)||buildingIndex<0)throw Error('Invalid East One OSM index');
 const h=building.height,index=buildingIndex;
 const edges=cellBoundary(planCells(building.points));
 // Candidate photo entrance only. The school official address ties the college
 // to East One, but the Commons camera photo has no geodetic facing azimuth.
 const face=edges.filter(e=>e.length>90&&e.length<99&&e.nz>.8)[0];
 if(!face)throw Error('Expected East One southern 94m candidate edge missing');
 const c=face.length*.5,span=9.3,left=c-span*.5,right=c+span*.5;
 const at=(s,y,o=0)=>[
  face.a[0]+face.ux*s+face.nx*o,baseY+y,
  face.a[1]+face.uz*s+face.nz*o
 ];
 const kit=ownedArchitecture('East One 2025 EE campus glass entry only / no second whole-building shell',{
  baseY,stage,uniforms,stoneTileScale:2.15,
  extraMaterials:{
   red:new THREE.MeshStandardMaterial({color:'#a33239',roughness:.72,metalness:.14}),
   beige:new THREE.MeshStandardMaterial({color:'#c2bfb5',roughness:.89}),
   steps:new THREE.MeshStandardMaterial({color:'#a7a49c',roughness:.96})
  }
 });
 if(!kit.gray){
  kit.materials.stone.color.set('#a1a199');
  kit.materials.glass.color.set('#6d898b');
  kit.materials.red.color.set('#a7353d');
  kit.materials.beige.color.set('#bdbab1');
 }
 // This intentionally does NOT add the OSM footprint or roof. The existing
 // createEastHistoricAsset still owns building 263625677. Protrusion offsets
 // avoid coplanar z-fighting with its generic historic brick wall.
 for(const [from,to] of [[left,left+.70],[right-.70,right]]){
  kit.plane('beige',face,from,to,0,6.4,index,h,.32);
 }
 kit.plane('beige',face,left,right,3.85,4.21,index,h,.35);
 kit.plane('beige',face,left,right,6.17,6.48,index,h,.32);
 // Upper landing lights in the Commons photo, red-framed steel glazing.
 kit.plane('glass',face,c-2.15,c+2.15,4.39,5.84,index,h,.39);
 for(const s of [c-2.15,c,c+2.15])kit.plane('red',face,s-.056,s+.056,4.36,5.85,index,h,.48);
 kit.plane('red',face,c-2.18,c+2.18,5.03,5.13,index,h,.48);
 // Entrance red glazed vestibule: opaque reflective glass by design.
 kit.plane('glass',face,c-2.23,c+2.23,.45,3.45,index,h,.42);
 for(const s of [c-2.23,c-1.42,c,c+1.42,c+2.23])kit.plane('red',face,s-.060,s+.060,.42,3.5,index,h,.53);
 for(const y of [.46,2.72,3.45])kit.plane('red',face,c-2.27,c+2.27,y-.058,y+.058,index,h,.53);
 // The image has a white vertical college nameplate to the VIEWER'S RIGHT.
 // This photo proves its ordering, but not the final global compass edge.
 kit.plane('beige',face,c-3.45,c-2.67,.42,4.00,index,h,.49);
 const stairCount=4;
 for(let i=0;i<stairCount;i++){
  const elevation=(stairCount-i)*.14,center=at(c,elevation*.5,1.3+i*.55);
  const geo=new THREE.BoxGeometry(span*.98,elevation,.58);
  geo.rotateY(-Math.atan2(face.uz,face.ux));
  geo.translate(...center);
  kit.add('steps',geo,index,h);
 }
 const a=kit.finish({
  owner:'src/assets/south/east-one-entrance-overlay.js',
  osmIds:[EAST_ONE_ID],integrationMode:'OVERLAY_ON_EXISTING_EAST_HISTORIC_ASSET',
  schoolAddressSource:EAST_ONE_SCHOOL,photoSource:EAST_ONE_PHOTO,
  photoAuthor:'Liuxingy',photoLicense:'CC BY-SA 4.0',photoDate:'unconfirmed',
  photoToOsmEdgeStatus:'PROVISIONAL_SOUTH_94M_EDGE',
  heightStatus:'unmeasured-osm-estimate',roofStatus:'legacy-East-historic-roof-not-overridden',
  confirmedFeatures:['grey-brick','red-metal-glass-portal','light-stone-surround','right-hand-vertical-college-plaque','entrance-steps'],
  unverifiedFeatures:['global-photo-azimuth','exact-portal-dimensions','stone-tile-joints','stairs-count','upper-window-count'],
  decorativeLedTickerOmitted:true,
  excludeId:INSULATION_BUILDING_ID,
  face:{center:at(c,3.3,.6),normal:[face.nx,face.nz],tangent:[face.ux,face.uz]},
  sourceDataUnchanged:true
 });
 const texture=stage==='massing'?null:inscriptionTexture();
 if(texture){
  const geo=new THREE.PlaneGeometry(.53,3.20),material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,depthWrite:false});
  const sign=new THREE.Mesh(geo,material),s=c-3.08;
  sign.position.set(...at(s,2.17,.59));
  sign.rotation.y=Math.atan2(face.nx,face.nz);
  geo.setAttribute('buildingIndex',new THREE.Float32BufferAttribute(Array(geo.attributes.position.count).fill(index),1));
  geo.setAttribute('assetHeight',new THREE.Float32BufferAttribute(Array(geo.attributes.position.count).fill(h),1));
  sign.name='East One EE College vertical entrance plaque';
  sign.userData.buildingAssetMesh=true;sign.userData.owner='src/assets/south/east-one-entrance-overlay.js';
  a.add(sign);
  const prior=a.dispose;a.dispose=()=>{prior();texture.dispose();};
 }
 return a;
}
