import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createPhotoBuildingAssets,PHOTO_BUILDING_IDS} from '../src/photo-building-integration.js'
const data=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'))
test('R24 integrates nine distinct committed photo-evidenced OSM building assets',()=>{
 assert.equal(PHOTO_BUILDING_IDS.length,9)
 assert.equal(new Set(PHOTO_BUILDING_IDS).size,9,'no duplicated footprints')
 for(const id of PHOTO_BUILDING_IDS)assert.ok(data.buildings.some(b=>b.osmId===id),'missing OSM '+id)
 const group=createPhotoBuildingAssets({buildings:data.buildings,baseY:1.1})
 try{
  assert.equal(group.children.length,9,'four Z-negative and five Z-positive assets')
  assert.deepEqual(group.userData.osmIds.sort((a,b)=>a-b),[...PHOTO_BUILDING_IDS].sort((a,b)=>a-b))
  for(const asset of group.children){
   assert.ok(asset.children.some(m=>m.isMesh),'asset without render mesh')
   assert.ok(asset.userData.osmIds?.every(id=>PHOTO_BUILDING_IDS.includes(id)),'asset metadata missing OSM ownership')
  }
  let meshes=0
  group.traverse(o=>{if(o.isMesh)meshes++})
  assert.ok(meshes>=18,'real facades should have multiple geometry batches')
  group.setColorMode('category');group.setColorMode('natural')
 }finally{group.dispose();group.dispose()}
})
test('production CampusWorld excludes nine old placeholder masses and mounts photo meshes into picking',()=>{
 const world=fs.readFileSync(new URL('../src/world.js',import.meta.url),'utf8')
 assert.ok(world.includes('isPhotoBuilding(b.osmId)'),'old generic massing should not render under new photos')
 assert.ok(world.includes('this.photoBuildingAssets=createPhotoBuildingAssets'),'campus needs real photo building group')
 assert.ok(world.includes('this.photoBuildingAssets.traverse'),'selection raycasts must include new meshes')
 assert.ok(world.includes('this.photoBuildingAssets?.setColorMode(mode)'),'view modes need consistent colors')
})
test('R24 preserves source coordinates and data and has no overlap with already-owned campus buildings',()=>{
 const original=JSON.stringify(data)
 const excluded=new Set([263624481,263625085,263632364,263624056,1167525875])
 for(const id of PHOTO_BUILDING_IDS)assert.equal(excluded.has(id),false,'already dedicated campus asset owns '+id)
 const group=createPhotoBuildingAssets({buildings:data.buildings,baseY:1.1})
 try{
  for(const asset of group.children){
   assert.ok(asset.position.length()<1e-6,'asset must remain at world origin, not translated twice')
  }
 }finally{group.dispose()}
 assert.equal(JSON.stringify(data),original)
})
