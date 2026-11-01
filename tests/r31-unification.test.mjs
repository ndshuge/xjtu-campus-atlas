import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {PHOTO_BUILDING_IDS,createPhotoBuildingAssets,createPhotoBuildingEntranceOverlays} from '../src/photo-building-integration.js'
import {createUnifiedCampusBuildingOverlays,UNIFIED_BUILDING_REPLACEMENTS,UNIFIED_OVERLAY_IDS} from '../src/building-unification.js'
const campus=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'))
const replacementIds=[264106085,263808681,263808685,1288039224,1288039225,1288039226]
const overlayIds=[264106102,263633896,264106086,263624056,263808681,263808683,263808684,263625088,263625089,263625087,263625090,263632772,264108763]
test('R31 no lost committed north & south replacements and no duplicated OSM ids',()=>{
 assert.deepEqual(UNIFIED_BUILDING_REPLACEMENTS.map(x=>x.osmId).sort((a,b)=>a-b),replacementIds.slice().sort((a,b)=>a-b))
 assert.equal(PHOTO_BUILDING_IDS.length,18,'R27 twelve plus six reliable new replacements; historic memorial is review-only')
 assert.equal(new Set(PHOTO_BUILDING_IDS).size,PHOTO_BUILDING_IDS.length)
 assert.deepEqual(UNIFIED_OVERLAY_IDS.slice().sort((a,b)=>a-b),overlayIds.slice().sort((a,b)=>a-b))
 for(const id of PHOTO_BUILDING_IDS)assert.ok(campus.buildings.some(b=>b.osmId===id),'unknown OSM '+id)
})
test('R31 integrates 18 complete models, never replaces an existing central/east historic shell',()=>{
 const snapshot=JSON.stringify(campus)
 const assets=createPhotoBuildingAssets({buildings:campus.buildings})
 try{
  assert.equal(assets.children.length,18)
  for(const asset of assets.children)assert.ok(asset?.userData?.osmIds||asset?.userData?.osmId)
  assert.equal(new Set(assets.children.flatMap(x=>x.userData.osmIds||[x.userData.osmId])).size,18)
 }finally{assets.dispose()}
 assert.equal(JSON.stringify(campus),snapshot,'no edit to original OSM objects')
})
test('R31 preserved host shells have additive, pickable, themeable, disposable overlays',()=>{
 const layer=createUnifiedCampusBuildingOverlays({buildings:campus.buildings,installedBaseIds:[...PHOTO_BUILDING_IDS,263625088,263625089,263625087,263624056,263633896,264106102,264106086,263808683,263808684]})
 try{
  assert.ok(layer.children.length>=12)
  const ids=new Set(layer.children.flatMap(x=>x.userData.osmIds||[x.userData.osmId]))
  for(const id of overlayIds)assert.ok(ids.has(id),'missing overlay '+id)
  assert.equal(typeof layer.setColorMode,'function')
  layer.setColorMode('category');layer.setColorMode('natural')
 }finally{layer.dispose();layer.dispose()}
})
test('R31 excludes 5 evidence-only dorm schematic replacements and Workshop B, East12 review from publication',()=>{
 const forbidden=[263808688,264106099,264107453,264107444,264106088,264420412,264288694]
 for(const id of forbidden)assert.ok(!PHOTO_BUILDING_IDS.includes(id),'unverified production replacement '+id)
 const original=createPhotoBuildingEntranceOverlays({buildings:campus.buildings})
 try{assert.equal(original.children.length,1,'preserve original historic East One one-time overlay')}finally{original.dispose()}
 const world=readFileSync(new URL('../src/world.js',import.meta.url),'utf8')
 assert.ok(world.includes('createUnifiedCampusBuildingOverlays('))
 assert.ok(world.includes('this.unifiedCampusBuildingOverlays?.setColorMode(mode)'))
})
