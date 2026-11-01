import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createPhotoBuildingAssets,createPhotoBuildingEntranceOverlays,PHOTO_BUILDING_IDS,isPhotoBuilding} from '../src/photo-building-integration.js'
import {EAST_HISTORIC_IDS} from '../src/east-historic-asset.js'
const data=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'))
const baseline=JSON.stringify(data)
test('R27 integrates one new photo-guided building without double-owning existing East One',()=>{
 assert.ok(PHOTO_BUILDING_IDS.length>=12,'all earlier R27 buildings retained')
 assert.equal(new Set(PHOTO_BUILDING_IDS).size,PHOTO_BUILDING_IDS.length)
 assert.equal(isPhotoBuilding(263633887),true,'Workshop A now has its own geometry')
 assert.equal(isPhotoBuilding(264420412),false,'Workshop B is a separate structure')
 assert.equal(isPhotoBuilding(263625677),false,'East One is ALREADY owned by the historic shell, overlay only')
 assert.equal(isPhotoBuilding(264414271),false,'Insulation lab is not East One')
 assert.ok(EAST_HISTORIC_IDS.includes(263625677))
 const g=createPhotoBuildingAssets({buildings:data.buildings,baseY:1.1})
 try{
  assert.equal(g.children.length,PHOTO_BUILDING_IDS.length)
  const a=g.children.find(x=>x.userData?.osmIds?.includes(263633887))
  assert.ok(a,'Workshop A must load')
  assert.equal(a.userData.otherWorkshopIdExcluded,264420412)
  assert.ok(a.children.some(x=>x.isMesh))
  a.traverse(x=>{if(x.isMesh)assert.ok(x.geometry.getAttribute('buildingIndex'),'Workshop A picking must work')})
  g.setColorMode('category')
  g.setColorMode('natural')
 }finally{g.dispose();g.dispose()}
})
test('R27 East One is a standalone entrance overlay, not a duplicate building shell',()=>{
 assert.equal(typeof createPhotoBuildingEntranceOverlays,'function')
 const g=createPhotoBuildingEntranceOverlays({buildings:data.buildings,baseY:1.1})
 try{
  assert.equal(g.children.length,1)
  const a=g.children[0]
  assert.deepEqual(a.userData.osmIds,[263625677])
  assert.equal(a.userData.integrationMode,'OVERLAY_ON_EXISTING_EAST_HISTORIC_ASSET')
  assert.equal(a.userData.excludeId,264414271)
  assert.ok(a.userData.photoSource.includes('commons.wikimedia.org'))
  assert.ok(a.userData.photoToOsmEdgeStatus.includes('PROVISIONAL'))
  let n=0;a.traverse(x=>{if(x.isMesh){n++;assert.ok(x.geometry.getAttribute('buildingIndex'))}})
  assert.ok(n>=3)
  g.setColorMode('category');g.setColorMode('natural')
 }finally{g.dispose();g.dispose()}
})
test('R27 hooks overlay into actual scene picking and color modes; OSM source unchanged',()=>{
 const world=readFileSync(new URL('../src/world.js',import.meta.url),'utf8')
 assert.ok(world.includes('this.photoEntranceOverlays=createPhotoBuildingEntranceOverlays('))
 assert.ok(world.includes('this.photoEntranceOverlays.traverse('))
 assert.ok(world.includes('this.photoEntranceOverlays?.setColorMode(mode)'))
 assert.equal(JSON.stringify(data),baseline)
})
