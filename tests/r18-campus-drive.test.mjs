import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRacingPhysics} from '../src/racing/physics.js'
import {createCampusDriveTrack,planCampusDrive} from '../src/racing/campus-track.js'

const fixture=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'))
const snapshot=JSON.stringify(fixture)

test('R18 entry spawns on mapped campus road, never at synthetic training coordinates',()=>{
 const course=planCampusDrive(fixture)
 assert.equal(course.roadId,'way/148313517/0')
 assert.equal(course.name,'梧桐东道')
 assert.ok(course.lengthMeters>500)
 assert.ok(course.spawn[0]>118&&course.spawn[0]<127)
 assert.ok(course.spawn[2]>-60&&course.spawn[2]<39)
 assert.ok(course.spawn[0]<900)
 assert.ok(Math.abs(Math.abs(course.heading)-Math.PI)<.08,'north to south should face -Z')
 assert.equal(JSON.stringify(fixture),snapshot,'OSM geometry remains immutable')
})

test('mapped roadway offers physical suspension contact and motion south past real scene',()=>{
 const course=planCampusDrive(fixture)
 const sim=createRacingPhysics({spawn:course.spawn,heading:course.heading})
 const track=createCampusDriveTrack({physics:sim,data:fixture,course})
 try{
  assert.ok(track.proxies.some(x=>x.kind==='mapped-road'))
  assert.ok(track.proxies.some(x=>x.kind==='building'))
  for(let i=0;i<150;i++)sim.stepFixed(1/60)
  const initial=sim.getState()
  assert.ok(initial.wheels.filter(x=>x.contact).length>=2,'road collider actually supports tires')
  assert.ok(Math.abs(initial.position[0]-course.spawn[0])<2)
  sim.setInput({throttle:1})
  for(let i=0;i<115;i++)sim.stepFixed(1/60)
  const end=sim.getState()
  assert.ok(end.position[2]<initial.position[2]-5,'vehicle progresses south along real campus avenue')
  assert.ok(end.speedKmh>12)
  sim.reset()
  const q=sim.getState().quaternion
  assert.ok(Math.abs(q[1])>.95,'reset retains street-facing heading')
  assert.ok(Math.abs(sim.getState().position[2]-course.spawn[2])<.01)
 }finally{
  track.destroy()
  assert.equal(sim.world.bodies.filter(x=>x.mass===0).length,0,'no collision proxy leak')
  sim.destroy()
 }
 assert.equal(JSON.stringify(fixture),snapshot,'no mutation of original campus data')
})

test('reject unknown paths or non-road surfaces instead of inventing navigable roads',()=>{
 assert.throws(()=>planCampusDrive(fixture,{roadId:'made-up'}))
 const data={...fixture,roads:[{id:'way/148313517/0',width:7,kind:'footway',campus:true,points:[[0,0],[0,15]]}]}
 assert.throws(()=>planCampusDrive(data))
})

test('collider lifecycle is idempotent and collision remains independent of visual scene',()=>{
 const course=planCampusDrive(fixture)
 const sim=createRacingPhysics({spawn:course.spawn,heading:course.heading})
 const initial=sim.world.bodies.length
 const track=createCampusDriveTrack({physics:sim,data:fixture,course})
 assert.ok(track.proxies.length>18)
 assert.ok(sim.world.bodies.length>initial)
 track.destroy()
 track.destroy()
 assert.equal(sim.world.bodies.length,initial)
 sim.destroy()
})
