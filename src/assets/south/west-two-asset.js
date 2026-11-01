import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {planCells,cellBoundary} from '../../library-asset-plan.js';

export const WEST_TWO_ID=263625676;
export const WEST_TWO_OFFICIAL_2026='https://news.xjtu.edu.cn/info/1002/230871.htm';
export const WEST_TWO_OFFICIAL_2025='https://news.xjtu.edu.cn/info/1002/224157.htm';

function entranceCandidate(edges){
 // Interior corridor face, candidate only; not triangulated from photo GPS.
 // This old school has several different courtyards and repeated entrances.
 return edges.filter(e=>e.length>33&&e.length<42).sort((a,b)=>{
  const score=e=>Math.abs((e.a[0]+e.b[0])*.5+321.9)+
    2*Math.abs((e.a[1]+e.b[1])*.5+381.4);
  return score(a)-score(b);
 })[0];
}
function verticalNameTexture(){
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=256;c.height=1024;
 const g=c.getContext('2d');g.fillStyle='#ececea';g.fillRect(0,0,256,1024);
 g.textAlign='center';g.textBaseline='middle';
 g.font='bold 104px "Microsoft YaHei",sans-serif';g.fillStyle='#33373a';
 const name='机械工程学院';
 for(let i=0;i<name.length;i++)g.fillText(name[i],128,(i+.5)*1024/name.length);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
 return tex;
}

export function createWestTwoAsset({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 if(building?.osmId!==WEST_TWO_ID)throw Error('Expected OSM 263625676');
 if(!Number.isInteger(buildingIndex)||buildingIndex<0)throw Error('Invalid West 2 index');
 const index=buildingIndex,h=building.height,cells=planCells(building.points),edges=cellBoundary(cells);
 const face=entranceCandidate(edges);if(!face)throw Error('West 2 candidate courtyard entrance edge not found');
 const L=face.length,c=L*.5,entryWidth=Math.min(6.9,L*.24);
 const from=c-entryWidth*.5,to=c+entryWidth*.5;
 const group=ownedArchitecture('Xingqing West 2 historic engineering entrance / 2026',{baseY,uniforms,stage,
  stoneTileScale:1.28,stoneTileOptions:{jointWidth:.012,jointContrast:.11},
  extraMaterials:{
   portal:new THREE.MeshStandardMaterial({color:'#c4c4bf',roughness:.83}),
   red:new THREE.MeshStandardMaterial({color:'#833e36',metalness:.21,roughness:.67}),
   dark:new THREE.MeshStandardMaterial({color:'#45494a',roughness:.82})
  }});
 if(!group.gray){
  group.materials.stone.color.set('#aaa59c');
  group.materials.portal.color.set('#b8b7b3');
  group.materials.red.color.set('#7d382e');
  group.materials.glass.color.set('#3a535f');
  group.materials.roof.color.set('#99978e');
 }
 // Only the entrance plus a short adjacent bay can be matched to official photos.
 // Full campus wings stay unphotographed grey brick, preserving OSM silhouette.
 for(const edge of edges)group.plane('stone',edge,0,edge.length,0,h,index,h);
 group.roof(cells,h,index,h);
 // Portico is a tall grey stone frame with red glazed doors beneath it.
 const portalFrom=from-.92,portalTo=to+.92;
 group.plane('portal',face,portalFrom,portalFrom+.74,0,7.20,index,h,.105);
 group.plane('portal',face,portalTo-.74,portalTo,0,7.20,index,h,.105);
 group.plane('portal',face,portalFrom,portalTo,6.65,7.30,index,h,.11);
 group.plane('dark',face,from,to,4.10,6.40,index,h,.11);
 group.plane('red',face,from,to,.18,4.12,index,h,.12);
 group.plane('glass',face,from+.18,to-.18,.35,3.88,index,h,.155);
 for(const t of [from+.15,c-.50,c+.50,to-.15]){
  group.plane('red',face,t-.055,t+.055,.35,3.90,index,h,.208);
 }
 group.plane('red',face,from,to,3.87,4.06,index,h,.22);
 group.plane('red',face,from,to,.22,.39,index,h,.22);
 // 2025 renovation image shows red window frames with beige-grey masonry.
 // This subset of adjacent bays is a candidate, NOT full elevation survey.
 const bayPositions=[c-12.4,c-9.1,c+10.0,c+13.2];
 for(const s of bayPositions){
  const a=s-1.03,z=s+1.03;
  if(a<1||z>L-1)continue;
  for(const [low,high] of [[2.0,4.45],[8.25,10.66]]){
   group.plane('red',face,a,z,low,high,index,h,.055);
   group.plane('glass',face,a+.12,z-.12,low+.15,high-.15,index,h,.092);
   group.plane('red',face,s-.052,s+.052,low+.12,high-.13,index,h,.136);
   group.plane('red',face,a,z,low+.88,low+1.0,index,h,.136);
  }
 }
 const nameplateAlong=from-1.38;
 const nameplateCenter=[face.a[0]+face.ux*nameplateAlong+face.nx*.19,baseY+4.0,face.a[1]+face.uz*nameplateAlong+face.nz*.19];
 const asset=group.finish({owner:'src/assets/south/west-two-asset.js',
  osmIds:[WEST_TWO_ID],buildingCampus:'Xingqing',
  currentOfficialSource:WEST_TWO_OFFICIAL_2026,constructionSource:WEST_TWO_OFFICIAL_2025,
  sourceLicense:'official-photographs-reference-only',
  heightStatus:'unmeasured-osm-estimate',roofStatus:'unknown-flat-placeholder',
  entranceOrientationStatus:'provisional-courtyard-edge',
  temporaryDecorationsOmitted:['red-lanterns','celebration-banner'],
  confirmedFeatures:['tall-grey-stone-portal','red-framed-glass-entry',
   'mechanical-engineering-vertical-nameplate','old-brick-and-red-window-frames'],
  inferredFeatures:['which-OSM-courtyard-edge','window-count','window-rhythm','entrance-width','entrance-height'],
  nameplateCenter,sourceDataUnchanged:true,
  geometryStatus:'post-2026 official entrance design cues only; exterior faces approximate',
  front:{center:[face.a[0]+face.ux*c,baseY+4,face.a[1]+face.uz*c],
   normal:[face.nx,face.nz],tangent:[face.ux,face.uz]}});
 const tex=stage==='massing'?null:verticalNameTexture();
 if(tex){
  const geometry=new THREE.PlaneGeometry(1.10,5.6);
  const material=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,depthWrite:false});
  const plaque=new THREE.Mesh(geometry,material);
  const s=nameplateAlong;
  plaque.position.set(face.a[0]+face.ux*s+face.nx*.19,
   baseY+4.0,face.a[1]+face.uz*s+face.nz*.19);
  plaque.rotation.y=Math.atan2(face.nx,face.nz);
  geometry.setAttribute('buildingIndex',new THREE.Float32BufferAttribute(Array(geometry.attributes.position.count).fill(index),1));
  geometry.setAttribute('assetHeight',new THREE.Float32BufferAttribute(Array(geometry.attributes.position.count).fill(h),1));
  plaque.userData.buildingAssetMesh=true;plaque.userData.owner='src/assets/south/west-two-asset.js';
  plaque.name='West 2 mechanical engineering school vertical photo-sign';
  asset.add(plaque);
  const oldDispose=asset.dispose;asset.dispose=()=>{oldDispose();tex.dispose();};
 }
 return asset;
}
