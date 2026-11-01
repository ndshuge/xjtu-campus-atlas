/** R24 source-controlled building overlays; source footprints remain OSM originals. */
import * as THREE from 'three'
import {createZNegativeBuildingAssets,Z_NEGATIVE_ASSET_IDS} from './assets/south/index.js'
import {createNanyangEast7Asset,NANYANG_EAST7_ID} from './assets/north/nanyang-east7-asset.js'
import {createNanyangEast8Asset,NANYANG_EAST8_ID} from './assets/north/nanyang-east8-asset.js'
import {createNanyangEast9Asset,NANYANG_EAST9_ID} from './assets/north/nanyang-east9-asset.js'
import {createPengkangCompoundAsset,PENGKANG_COMPOUND_ID} from './assets/north/pengkang-compound-asset.js'
import {createKangqiaoDiningAsset,KANGQIAO_DINING_ID} from './assets/north/kangqiao-dining-asset.js'

const northFactories=Object.freeze([
 [NANYANG_EAST7_ID,createNanyangEast7Asset],
 [NANYANG_EAST8_ID,createNanyangEast8Asset],
 [NANYANG_EAST9_ID,createNanyangEast9Asset],
 [PENGKANG_COMPOUND_ID,createPengkangCompoundAsset],
 [KANGQIAO_DINING_ID,createKangqiaoDiningAsset]
])
export const PHOTO_BUILDING_IDS=Object.freeze([...Z_NEGATIVE_ASSET_IDS,...northFactories.map(x=>x[0])])
const owned=new Set(PHOTO_BUILDING_IDS)
export const isPhotoBuilding=id=>owned.has(id)

export function createPhotoBuildingAssets({buildings,baseY=1.1,uniforms={},stage='material'}={}){
 if(!Array.isArray(buildings))throw new TypeError('OSM buildings array required')
 const group=new THREE.Group()
 group.name='R24 verified photo-informed campus buildings'
 const southern=createZNegativeBuildingAssets({buildings,baseY,uniforms,stage})
 for(const asset of southern.children.slice()){southern.remove(asset);group.add(asset)}
 // Individual branch assets own geometry and dispose methods.
 for(const [id,create] of northFactories){
  const building=buildings.find(b=>b.osmId===id)
  if(!building)continue
  group.add(create({building,buildingIndex:buildings.indexOf(building),baseY,uniforms,stage}))
 }
 group.userData={owner:'r24-production-integration',osmIds:[...PHOTO_BUILDING_IDS],stage,
  source:'committed R21 north and Z<0 building assets',surveyed:false}
 group.setColorMode=value=>{for(const asset of group.children)asset.setColorMode?.(value)}
 let closed=false
 group.dispose=()=>{if(closed)return;closed=true;for(const asset of group.children.slice()){asset.dispose?.();group.remove(asset)}group.removeFromParent()}
 return group
}
