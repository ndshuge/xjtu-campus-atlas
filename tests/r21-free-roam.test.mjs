import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {planFreeRoamSpawn} from '../src/racing/free-roam.js'
import {createRacingPhysics} from '../src/racing/physics.js'
import {createCampusRoadNetwork} from '../src/racing/road-network.js'
import {createStreamedRoadColliders} from '../src/racing/network-physics.js'
import {BASE} from '../src/geo.js'
const data=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'))
test('selectable east stadium starts on mapped infield, not a fabricated track or roadway',()=>{
 const field=data.surfaces.find(x=>x.id==='way/1288042500')
 const plan=planFreeRoamSpawn(data)
 assert.equal(plan.roadId,'area:east-stadium')
 assert.equal(plan.areaId,field.id)
 assert.ok(Math.abs(plan.spawn[0]-field.center[0])<5)
 assert.ok(Math.abs(plan.spawn[2]-field.center[1])<5)
 assert.equal(plan.spawn[1],BASE+1.3)
 assert.throws(()=>planFreeRoamSpawn({surfaces:[]}),/stadium/)
})
test('car launched in stadium can throttle freely over grass with real wheel contact',()=>{
 const plan=planFreeRoamSpawn(data),sim=createRacingPhysics({spawn:plan.spawn,heading:plan.heading})
 const track=createStreamedRoadColliders({physics:sim,network:createCampusRoadNetwork(data),data,trees:[],radius:115})
 try{
  track.update(plan.spawn)
  for(let i=0;i<160;i++)sim.stepFixed(1/60)
  const before=sim.getState()
  assert.ok(before.wheels.every(w=>w.contact),'all four wheels should rest on grass')
  sim.setInput({throttle:1})
  for(let i=0;i<120;i++){track.update(sim.getState().position);sim.stepFixed(1/60)}
  const after=sim.getState()
  assert.ok(Math.hypot(after.position[0]-before.position[0],after.position[2]-before.position[2])>4)
  assert.ok(after.position[1]>BASE-.2)
 }finally{track.destroy();sim.destroy()}
})
