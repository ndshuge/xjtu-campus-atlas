/** R24 source-controlled building overlays; source footprints remain OSM originals. */
import * as THREE from 'three'
import {createZNegativeBuildingAssets,Z_NEGATIVE_ASSET_IDS} from './assets/south/index.js'
import {createMathBuildingAsset,MATH_BUILDING_ID} from './assets/south/math-building-asset.js'
import {createSportsEducationCenterAsset,SPORTS_CENTER_OSM_ID} from './assets/south/sports-education-center-asset.js'
import {createEngineeringWorkshopAAsset,ENGINEERING_WORKSHOP_A_ID} from './assets/south/engineering-workshop-a-asset.js'
import {createEastOneEntranceOverlay,EAST_ONE_ID} from './assets/south/east-one-entrance-overlay.js'
import {createNanyangEast7Asset,NANYANG_EAST7_ID} from './assets/north/nanyang-east7-asset.js'
import {createNanyangEast8Asset,NANYANG_EAST8_ID} from './assets/north/nanyang-east8-asset.js'
import {createNanyangEast9Asset,NANYANG_EAST9_ID} from './assets/north/nanyang-east9-asset.js'
import {createPengkangCompoundAsset,PENGKANG_COMPOUND_ID} from './assets/north/pengkang-compound-asset.js'
import {createKangqiaoDiningAsset,KANGQIAO_DINING_ID} from './assets/north/kangqiao-dining-asset.js'
import {UNIFIED_BUILDING_REPLACEMENTS} from './building-unification.js'

const additionalSouthFactories=Object.freeze([
 [MATH_BUILDING_ID,createMathBuildingAsset],
 [SPORTS_CENTER_OSM_ID,createSportsEducationCenterAsset],
 [ENGINEERING_WORKSHOP_A_ID,createEngineeringWorkshopAAsset]
])
const northFactories=Object.freeze([
 [NANYANG_EAST7_ID,createNanyangEast7Asset],
 [NANYANG_EAST8_ID,createNanyangEast8Asset],
 [NANYANG_EAST9_ID,createNanyangEast9Asset],
 [PENGKANG_COMPOUND_ID,createPengkangCompoundAsset],
 [KANGQIAO_DINING_ID,createKangqiaoDiningAsset]
])
export const PHOTO_BUILDING_IDS=Object.freeze([...Z_NEGATIVE_ASSET_IDS,...additionalSouthFactories.map(x=>x[0]),...northFactories.map(x=>x[0]),...UNIFIED_BUILDING_REPLACEMENTS.map(x=>x.osmId)])
const owned=new Set(PHOTO_BUILDING_IDS)
export const isPhotoBuilding=id=>owned.has(id)

// East One's complete shell is already produced by east-historic-asset.js.
// This group owns ONLY the Commons-photo-guided portal overlay, not its OSM footprint.
export function createPhotoBuildingEntranceOverlays({buildings,baseY=1.1,uniforms={},stage='material'}={}){
 if(!Array.isArray(buildings))throw new TypeError('OSM buildings array required')
 const group=new THREE.Group()
 group.name='R27 confirmed entrance overlays on existing historic buildings'
 const b=buildings.find(x=>x.osmId===EAST_ONE_ID)
 if(b)group.add(createEastOneEntranceOverlay({
  building:b,buildingIndex:buildings.indexOf(b),baseY,uniforms,stage
 }))
 group.userData={owner:'r27-east-one-overlay',osmIds:b?[EAST_ONE_ID]:[],stage,
  integrationMode:'OVERLAY_ON_EXISTING_EAST_HISTORIC_ASSET',surveyed:false}
 group.setColorMode=mode=>{for(const asset of group.children)asset.setColorMode?.(mode)}
 let closed=false
 group.dispose=()=>{
  if(closed)return
  closed=true
  for(const asset of group.children.slice()){asset.dispose?.();group.remove(asset)}
  group.removeFromParent()
 }
 return group
}


export function createPhotoBuildingAssets({buildings,baseY=1.1,uniforms={},stage='material'}={}){
 if(!Array.isArray(buildings))throw new TypeError('OSM buildings array required')
 const group=new THREE.Group()
 group.name='R27 photo-informed campus buildings'
 const southern=createZNegativeBuildingAssets({buildings,baseY,uniforms,stage})
 for(const asset of southern.children.slice()){southern.remove(asset);group.add(asset)}
 // Individual branch assets own geometry and dispose methods.
 for(const [id,create] of [...additionalSouthFactories,...northFactories,...UNIFIED_BUILDING_REPLACEMENTS.map(s=>[s.osmId,s.create])]){
  const building=buildings.find(b=>b.osmId===id)
  if(!building)continue
  group.add(create({building,buildingIndex:buildings.indexOf(building),baseY,uniforms,stage}))
 }
 group.userData={owner:'r27-production-integration',osmIds:[...PHOTO_BUILDING_IDS],stage,
  source:'committed R21 north and Z<0 building assets',surveyed:false}
 group.setColorMode=value=>{for(const asset of group.children)asset.setColorMode?.(value)}
 let closed=false
 group.dispose=()=>{if(closed)return;closed=true;for(const asset of group.children.slice()){asset.dispose?.();group.remove(asset)}group.removeFromParent()}
 return group
}
