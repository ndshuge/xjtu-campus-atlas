import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {labelTexture} from '../../architecture-kit.js';

export const CHONGSHI_WEST16_ID=263808683;
export const CHONGSHI_WEST17_ID=263808684;
const REPORTED_GROSS_AREA_M2=534.5;

// This is the *connection* between two independently retained OSM dorms,
// not an invented third OSM footprint or replacement for either dorm.
// Official school photograph: https://cssy.xjtu.edu.cn/gycs/syhj.htm
// School article: https://www.xjtu.edu.cn/info/1016/29891.htm
// The official gross building area covers two storeys; the footprint is
// therefore estimated as ~half that area. Actual footprint is not surveyed.
export function createChongshiLinkAsset({
 west16,west17,buildingIndex,baseY=1.1,uniforms={},stage='material'
}={}){
 if(west16?.osmId!==CHONGSHI_WEST16_ID)throw Error('Chongshi link requires West16 OSM 263808683');
 if(west17?.osmId!==CHONGSHI_WEST17_ID)throw Error('Chongshi link requires West17 OSM 263808684');
 const northFace=Math.max(...west16.points.map(p=>p[1])),
       southFace=Math.min(...west17.points.map(p=>p[1]));
 const depth=southFace-northFace-.08;
 if(depth<8)throw Error('Chongshi link gap between West16 and West17 is invalid');
 const z0=northFace+.04,z1=southFace-.04,zc=(z0+z1)/2;
 const width=REPORTED_GROSS_AREA_M2/(depth*2);
 const east=Math.min(Math.max(...west16.points.map(p=>p[0])),
                     Math.max(...west17.points.map(p=>p[0])))-.45;
 const west=east-width,xc=(west+east)/2;
 const height=8.1; // illustrative two storeys, NOT a measured vertical survey
 const batch=ownedArchitecture('Chongshi courtyard / West16 West17 glass connector',{
  baseY,uniforms,stage,
  extraMaterials:{
   canopy:new THREE.MeshStandardMaterial({color:'#d7dad8',roughness:.71,metalness:.15})
  }
 });
 if(!batch.gray){
  batch.materials.stone.color.set('#d2d5d4');
  batch.materials.glass.color.set('#3f5055');
  batch.materials.frame.color.set('#b2b9ba');
  batch.materials.roof.color.set('#b6b7b4');
  batch.materials.dark.color.set('#29363c');
 }
 if(batch.gray){
  batch.box('stone',xc,0,zc,width,height,depth,buildingIndex,height);
 }else{
  // Two-story clear-span curtain wall facing the documented EAST entrance.
  batch.box('glass',east-.15,.12,zc,.14,height-.85,depth-.78,buildingIndex,height);
  batch.box('dark',east-.06,.16,zc,.07,.20,depth-.95,buildingIndex,height);
  batch.box('frame',east-.05,4.06,zc,.14,.21,depth-.7,buildingIndex,height);
  const glassSpan=depth-1.55,sections=Math.ceil(glassSpan/2.0);
  for(let i=0;i<=sections;i++){
   const z=z0+.80+glassSpan*i/sections;
   batch.box('frame',east-.035,.24,z,.13,height-1.08,.16,buildingIndex,height);
  }
  // A pair of recessed glazed entrance doors with steel jambs; the exact
  // location on the east elevation is not independently surveyed.
  for(const z of [zc-1.38,zc+1.38]){
   batch.box('glass',east+.013,.10,z,.10,2.86,2.48,buildingIndex,height);
   for(const zz of [z-1.23,z+1.23])
    batch.box('frame',east+.11,.08,zz,.12,3.04,.12,buildingIndex,height);
  }
  batch.box('canopy',xc,height-.70,zc,width+1.4,.64,depth+.28,buildingIndex,height);
  // Photographed light outer support with a diagonal steel brace.
  const brace=new THREE.BoxGeometry(.20,3.85,.20);
  brace.rotateZ(-.24);
  brace.translate(east+.21,baseY+4.95,z1-1.02);
  batch.add('frame',brace,buildingIndex,height);
  // Pale vertical name tower at one end of the photographed entry.
  batch.box('stone',east+.01,0,z0+1.12,.48,height-1.02,1.63,buildingIndex,height);
 }
 const asset=batch.finish({
  owner:'chongshi-link-asset.js',
  osmIds:[CHONGSHI_WEST16_ID,CHONGSHI_WEST17_ID],
  primaryBuildingIndex:buildingIndex,
  sourceDataUnchanged:true,
  geometryBasis:'OSM gap and official 2-storey steel connector',
  officialGrossAreaSqm:REPORTED_GROSS_AREA_M2,
  estimatedWidth:width,estimatedDepth:depth,
  eastEntranceFromOfficial:true,entranceOrientation:'east from official report',
  currentStateVerified:false,photoCaptureDate:null,
  evidenceUrl:'https://cssy.xjtu.edu.cn/gycs/syhj.htm',
  evidenceArticle:'https://www.xjtu.edu.cn/info/1016/29891.htm',
  photoLicense:'reference only, no source image or bitmap reused',
  unknown:'2026 entrance details, exact connector footprint/height, roofing, steel geometry and exact vertical inscription location'
 });
 if(!batch.gray){
  const texture=labelTexture('崇实书院',{width:256,height:768,vertical:true,
   color:'#59616a',background:'rgba(0,0,0,0)'});
  if(texture){
   const sign=new THREE.Mesh(new THREE.PlaneGeometry(.80,5.30),
    new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
   sign.name='Chongshi courtyard east facade vertical inscription';
   sign.position.set(east+.29,baseY+4.09,z0+1.12);
   sign.rotation.y=Math.PI/2;
   sign.userData.buildingIndex=buildingIndex;sign.userData.owner='chongshi-link-asset.js';
   asset.add(sign);
   const release=asset.dispose;
   let disposed=false;
   asset.dispose=()=>{if(disposed)return;disposed=true;release();texture.dispose();};
  }
 }
 return asset;
}
