/** R31 integration owned by the main publisher. Source assets copied unchanged
 * from named, committed construction SHAs; review-only assets remain excluded. */
import * as THREE from 'three'
import {createWutongDiningAsset,WUTONG_DINING_ID} from './assets/north/wutong-dining-asset.js'
import {createLizhiEast6Asset,LIZHI_EAST6_ID} from './assets/north/lizhi-east6-asset.js'
import {createZhongyingEast3Asset,ZHONGYING_EAST3_ID} from './assets/north/zhongying-east3-asset.js'
import {createWenzhiCourtyardAsset,WENZHI_COURTYARD_IDS} from './assets/north/wenzhi-courtyard-asset.js'
import {createCampusHospitalEntryAsset,HOSPITAL_ID} from './assets/north/campus-hospital-entry-asset.js'
import {createForeignLanguagesEntranceAsset,FOREIGN_LANGUAGES_ID} from './assets/north/foreign-languages-entrance-asset.js'
import {createWest13EntranceAsset,WEST13_DORM_ID} from './assets/north/west13-entrance-asset.js'
import {createSiyuanRoofMonitorAsset,SIYUAN_ROOF_ID} from './assets/north/siyuan-roof-monitor-asset.js'
import {createLizhiStarspaceAsset} from './assets/north/lizhi-starspace-asset.js'
import {createChongshiLinkAsset,CHONGSHI_WEST16_ID,CHONGSHI_WEST17_ID} from './assets/north/chongshi-link-asset.js'
import {createCentralOnePorticoOverlay,CENTRAL_ONE_ID} from './assets/south/central-one-portico-overlay.js'
import {createR21FivePhotoDetailAssets,R21_FIVE_DETAIL_IDS} from './assets/south/wave5-detail-factory.js'

// Replace the host generic OSM volume exactly once. Full-building assets are
// OSM-photo-informed candidates, not measured surveys.
export const UNIFIED_BUILDING_REPLACEMENTS=Object.freeze([
 {osmId:WUTONG_DINING_ID,create:createWutongDiningAsset,ref:'6b98601'},
 {osmId:LIZHI_EAST6_ID,create:createLizhiEast6Asset,ref:'8dccccb'},
 {osmId:ZHONGYING_EAST3_ID,create:createZhongyingEast3Asset,ref:'8dccccb'},
 ...WENZHI_COURTYARD_IDS.map(osmId=>({osmId,create:createWenzhiCourtyardAsset,ref:'8dccccb'})),
])
// Overlay: keep original host and add photo-constrained features. Connector
// touches two host footprints but is a single architectural object.
export const UNIFIED_OVERLAY_IDS=Object.freeze([
 HOSPITAL_ID,FOREIGN_LANGUAGES_ID,WEST13_DORM_ID,SIYUAN_ROOF_ID,LIZHI_EAST6_ID,
 CHONGSHI_WEST16_ID,CHONGSHI_WEST17_ID,CENTRAL_ONE_ID,...R21_FIVE_DETAIL_IDS
])
const overlays=[
 [HOSPITAL_ID,createCampusHospitalEntryAsset],
 [FOREIGN_LANGUAGES_ID,createForeignLanguagesEntranceAsset],
 [WEST13_DORM_ID,createWest13EntranceAsset],
 [SIYUAN_ROOF_ID,createSiyuanRoofMonitorAsset],
 [LIZHI_EAST6_ID,createLizhiStarspaceAsset],
 [CENTRAL_ONE_ID,createCentralOnePorticoOverlay]
]
export function createUnifiedCampusBuildingOverlays({buildings,installedBaseIds=[],baseY=1.1,uniforms={},stage='material'}={}){
 if(!Array.isArray(buildings))throw Error('R31 campus original OSM buildings required')
 const base=new Set(installedBaseIds)
 const byId=new Map(buildings.map((b,i)=>[b.osmId,{building:b,buildingIndex:i}]))
 const group=new THREE.Group()
 group.name='R31 photo-informed additive north and south details'
 try{
  for(const [id,create] of overlays){
   const input=byId.get(id)
   if(!input)throw Error('R31 overlay missing OSM '+id)
   if(!base.has(id))throw Error('R31 cannot overlay absent host base '+id)
   group.add(create(id===LIZHI_EAST6_ID?{dorm:input.building,buildingIndex:input.buildingIndex,baseY,uniforms,stage}:{...input,baseY,uniforms,stage}))
  }
  const west16=byId.get(CHONGSHI_WEST16_ID),west17=byId.get(CHONGSHI_WEST17_ID)
  if(!west16||!west17||!base.has(CHONGSHI_WEST16_ID)||!base.has(CHONGSHI_WEST17_ID))throw Error('R31 missing Chongshi dorm host')
  group.add(createChongshiLinkAsset({west16:west16.building,west17:west17.building,buildingIndex:west16.buildingIndex,baseY,uniforms,stage}))
  const details=createR21FivePhotoDetailAssets({buildings,installedBaseIds:base,baseY,uniforms,stage})
  for(const child of [...details.children]){details.remove(child);group.add(child)}
  details.dispose()
 }catch(e){for(const child of [...group.children])child.dispose?.();throw e}
 group.userData={owner:'R31 committed north and south integration',osmIds:[...UNIFIED_OVERLAY_IDS],surveyed:false,onlyAdditive:true}
 group.setColorMode=mode=>{for(const child of group.children)child.setColorMode?.(mode)}
 let disposed=false
 group.dispose=()=>{if(disposed)return;disposed=true;for(const child of [...group.children]){child.dispose?.();group.remove(child)};group.removeFromParent()}
 return group
}
