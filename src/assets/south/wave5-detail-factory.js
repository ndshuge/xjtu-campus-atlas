import * as THREE from 'three';
import {createCenterTwoRoofDetail} from './center-two-roof-detail.js';
import {createCenterThreeRoofDetail} from './center-three-roof-detail.js';
import {createMathRoofDetail} from './math-roof-detail.js';
import {createYifuCanopyDetail} from './yifu-canopy-detail.js';
import {createSportsLouverDetail} from './sports-louver-detail.js';

const builders=[
 [263625089,createCenterTwoRoofDetail],
 [263625087,createCenterThreeRoofDetail],
 [263625090,createMathRoofDetail],
 [263632772,createYifuCanopyDetail],
 [264108763,createSportsLouverDetail]
];
export const R21_FIVE_DETAIL_IDS=Object.freeze(builders.map(([id])=>id));

export function createR21FivePhotoDetailAssets({
 buildings,installedBaseIds,baseY=1.1,uniforms={},stage='material'
}={}){
 if(!Array.isArray(buildings))throw Error('Five-details factory needs original OSM buildings');
 const required=new Set(R21_FIVE_DETAIL_IDS);
 const bases=new Set(installedBaseIds||[]);
 for(const id of required)if(!bases.has(id))throw Error('Missing complete building base for OSM '+id);
 const byId=new Map();
 for(let i=0;i<buildings.length;i++){
  const b=buildings[i];
  if(!required.has(b.osmId))continue;
  if(byId.has(b.osmId))throw Error('Duplicate original OSM '+b.osmId);
  if(b.center?.[1]>=0)throw Error('Photo details must remain Z<0');
  byId.set(b.osmId,{building:b,buildingIndex:i});
 }
 for(const id of required)if(!byId.has(id))throw Error('Missing expected OSM '+id);
 const group=new THREE.Group();group.name='R21 five photo-guided local detail overlays';
 for(const [id,make] of builders){
  const record=byId.get(id);
  group.add(make({...record,baseY,uniforms,stage}));
 }
 group.userData={
  owner:'src/assets/south/wave5-detail-factory.js',
  osmIds:[...R21_FIVE_DETAIL_IDS],
  dependsOnInstalledBaseAssetIds:[...R21_FIVE_DETAIL_IDS],
  integrationStatus:'NOT_LOADED_BY_PRODUCTION_WORLD',
  allHeightsUnmeasured:true,
  replacementsAllowed:false,
  sourceDataUnchanged:true
 };
 group.setColorMode=mode=>{for(const a of group.children)a.setColorMode?.(mode);};
 let done=false;group.dispose=()=>{if(done)return;done=true;for(const a of [...group.children])a.dispose?.();group.removeFromParent();};
 return group;
}
