import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {PHOTO_BUILDING_IDS,createPhotoBuildingAssets,isPhotoBuilding} from '../src/photo-building-integration.js'
const campus=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'))
test('R25 integrates eleven unique committed photo-grounded buildings',()=>{
 assert.equal(PHOTO_BUILDING_IDS.length,11)
 assert.equal(new Set(PHOTO_BUILDING_IDS).size,11)
 for(const id of [263625090,264108763])assert.equal(isPhotoBuilding(id),true,'newly verified building is photo-owned')
 assert.equal(isPhotoBuilding(1219695761),false,'math teaching lab is not math building')
 assert.equal(isPhotoBuilding(264288694),false,'unresolved historic museum must not ship')
 for(const id of PHOTO_BUILDING_IDS)assert.ok(campus.buildings.some(b=>b.osmId===id),'missing actual building '+id)
 const group=createPhotoBuildingAssets({buildings:campus.buildings,baseY:1.1})
 try{
  assert.equal(group.children.length,11)
  assert.deepEqual(group.userData.osmIds.sort((a,b)=>a-b),[...PHOTO_BUILDING_IDS].sort((a,b)=>a-b))
  for(const id of [263625090,264108763]){
   const owned=group.children.find(x=>x.userData.osmIds.includes(id))
   assert.ok(owned,'new asset not mounted '+id)
   assert.ok(owned.children.some(x=>x.isMesh),'empty geometry for '+id)
   owned.traverse(x=>{if(x.isMesh)assert.ok(x.geometry.getAttribute('buildingIndex'),'pickable geometry required')})
  }
  group.setColorMode('category')
  group.setColorMode('natural')
 }finally{group.dispose();group.dispose()}
})
test('R25 preserves OSM, selection, and original shared scene integration',()=>{
 const s=readFileSync(new URL('../src/world.js',import.meta.url),'utf8')
 assert.ok(s.includes('isPhotoBuilding(b.osmId)'))
 assert.ok(s.includes('this.photoBuildingAssets.traverse'))
 assert.ok(s.includes('this.photoBuildingAssets?.setColorMode(mode)'))
})
