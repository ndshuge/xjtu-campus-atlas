import * as THREE from 'three';
import {ADMISSIONS_OFFICE_ID,createAdmissionsOfficeAsset} from './admissions-office-asset.js';
import {YIFU_ENGINEERING_ID,createYifuEngineeringAsset} from './yifu-engineering-asset.js';
import {TANG_ART_COURTYARD_ID,createTangArtCourtyardAsset} from './tang-art-courtyard-asset.js';
import {WEST_TWO_ID,createWestTwoAsset} from './west-two-asset.js';
// Z<0 is geographic north in the current local axes. This branch name is legacy.
export const Z_NEGATIVE_ASSET_IDS=Object.freeze([ADMISSIONS_OFFICE_ID,YIFU_ENGINEERING_ID,TANG_ART_COURTYARD_ID,WEST_TWO_ID]);
export function createZNegativeBuildingAssets({buildings,baseY=1.1,uniforms={},stage='material'}={}){
 if(!Array.isArray(buildings))throw Error('Expected OSM buildings');
 const seen=new Set();
 for(const b of buildings){
  if(!Z_NEGATIVE_ASSET_IDS.includes(b.osmId))continue;
  if(seen.has(b.osmId))throw Error('Duplicate owned OSM '+b.osmId);
  seen.add(b.osmId);
  if(b.center?.[1]>=0)throw Error('Owned asset outside Z<0: '+b.osmId);
 }
 const group=new THREE.Group();group.name='Z-negative owned photo-grounded buildings';
 for(const [id,build] of [[ADMISSIONS_OFFICE_ID,createAdmissionsOfficeAsset],[YIFU_ENGINEERING_ID,createYifuEngineeringAsset],[TANG_ART_COURTYARD_ID,createTangArtCourtyardAsset],[WEST_TWO_ID,createWestTwoAsset]]){
  const record=buildings.find(b=>b.osmId===id);if(!record)continue;
  group.add(build({building:record,buildingIndex:buildings.indexOf(record),baseY,uniforms,stage}));
 }
 group.userData={owner:'src/assets/south/index.js',osmIds:[...Z_NEGATIVE_ASSET_IDS],scope:'Z<0',
  integrationStatus:'not-loaded-by-production-world'};
 group.setColorMode=mode=>{for(const a of group.children)a.setColorMode?.(mode);};
 let released=false;
 group.dispose=()=>{if(released)return;released=true;for(const a of [...group.children])a.dispose?.();group.removeFromParent();};
 return group;
}
