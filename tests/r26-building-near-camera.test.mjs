import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const data=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'))
const baseline=JSON.stringify(data)
const frame=(await import('../src/building-near-camera.js').catch(()=>({}))).planBuildingCloseView

test('R26 has a dedicated pure close-up camera plan, separate from default selection',()=>{
 assert.equal(typeof frame,'function','missing planBuildingCloseView')
})
test('R26 approaches photo-grounded math/sports buildings from current camera side',()=>{
 assert.equal(typeof frame,'function')
 for(const id of [263625090,264108763,263808679]){
  const building=data.buildings.find(b=>b.osmId===id)
  const options={building,currentEye:[building.center[0]+110,105,building.center[1]+145],viewport:{width:1440,height:900},baseY:1.1}
  const result=frame(options)
  assert.ok(result&&result.position&&result.target)
  assert.ok(result.distance>=42&&result.distance<=138,'near view bounded: '+id)
  assert.ok(result.distance<170,'visibly closer than existing math building 220m')
  assert.ok(result.distance>=Math.min(132,Math.max(...result.footprint)*.82+13),'large OSM footprint must not be cropped by a height-only distance calculation')
  assert.ok(result.position[1]>building.height*.3,'camera must be above ground')
  assert.ok(result.target[1]>1.1&&result.target[1]<building.height+5)
  assert.equal(result.target[0],building.center[0])
  assert.equal(result.target[2],building.center[1])
  assert.ok(result.position[0]>result.target[0]&&result.position[2]>result.target[2],'preserve viewing azimuth')
  assert.deepEqual(frame(options),result,'same object and input => same camera')
 }
})
test('R26 plans responsive finite view and never mutates source OSM',()=>{
 assert.equal(typeof frame,'function')
 const building=data.buildings.find(b=>b.osmId===263625090)
 const desktop=frame({building,currentEye:[-110,95,-520],viewport:{width:1440,height:900},baseY:1.1})
 const portrait=frame({building,currentEye:[-110,95,-520],viewport:{width:390,height:844},baseY:1.1})
 assert.ok(portrait.distance>desktop.distance+12,'portrait framing must account for narrower screen')
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){
  const result=frame({building,currentEye:[-110,95,-520],viewport,baseY:1.1})
  assert.ok(result.distance>=42&&result.distance<=138)
  assert.ok([...result.position,...result.target,result.distance].every(Number.isFinite))
 }
 assert.equal(frame({building:{center:[0,0]},currentEye:[0,2,3],viewport:{width:390,height:844}}),null,'nonbuilding place must use previous behavior')
 assert.equal(JSON.stringify(data),baseline)
})
test('R26 detail CTA targets dedicated building closeup without changing ordinary focus',()=>{
 const app=readFileSync(new URL('../src/app.js',import.meta.url),'utf8')
 const world=readFileSync(new URL('../src/world.js',import.meta.url),'utf8')
 assert.ok(app.includes('world.focusNear(p)'),'primary detail action must use near focus')
 assert.ok(app.includes('world.focusNear(p);setDetailExpanded(false)'),'near action should collapse expanded mobile details to show the 3D building')
 assert.ok(world.includes('focusNear(p)'), 'world API missing')
 assert.ok(world.includes('planBuildingCloseView('),'camera planner unused')
})
