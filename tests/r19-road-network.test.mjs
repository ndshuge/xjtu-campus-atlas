import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createCampusRoadNetwork,nearestRoad,roadDistance,listDriveStartingRoads} from '../src/racing/road-network.js'
import {createStreamedRoadColliders} from '../src/racing/network-physics.js'
import {createRacingPhysics} from '../src/racing/physics.js'
import {planCampusDrive} from '../src/racing/campus-track.js'
const data=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'))
const original=JSON.stringify(data)
test('network contains true shared-node campus roads and omits disconnected/pedestrian geometries',()=>{
 const net=createCampusRoadNetwork(data)
 assert.equal(net.sourceRoadCount,111)
 assert.equal(net.roads.length,110,'largest verified shared-node component')
 assert.ok(net.lengthMeters>15000 && net.lengthMeters<17000)
 assert.ok(net.roads.some(x=>x.name==='梧桐东道'))
 assert.ok(net.roads.some(x=>x.name==='文治路'))
 assert.ok(!net.roads.some(x=>x.kind==='footway'))
 assert.equal(JSON.stringify(data),original)
})
test('named start locations are actually present in the connected road graph',()=>{
 const net=createCampusRoadNetwork(data)
 const starts=listDriveStartingRoads(net)
 for(const name of ['梧桐东道','梧桐西道','思源路','文治路','彭康路','学森路']){
  const road=starts.find(x=>x.name===name)
  assert.ok(road,'missing named campus driving start: '+name)
  const course=planCampusDrive(data,{roadId:road.id})
  assert.ok(course.lengthMeters>25)
  assert.equal(road.name,course.name)
 }
})
test('every exposed named road start supports stable driving without a synthetic level',()=>{
 const network=createCampusRoadNetwork(data)
 for(const choice of listDriveStartingRoads(network)){
  const course=planCampusDrive(data,{roadId:choice.id})
  const sim=createRacingPhysics({spawn:course.spawn,heading:course.heading})
  const track=createStreamedRoadColliders({physics:sim,network,data,radius:100,refreshDistance:25})
  try{
   track.update(course.spawn)
   for(let i=0;i<110;i++)sim.stepFixed(1/60)
   const init=sim.getState()
   assert.ok(init.wheels.some(w=>w.contact),'wheel contact on '+choice.name)
   sim.setInput({throttle:1})
   for(let i=0;i<120;i++){track.update(sim.getState().position);sim.stepFixed(1/60)}
   const end=sim.getState()
   assert.ok(Math.hypot(end.position[0]-init.position[0],end.position[2]-init.position[2])>4,'movement on '+choice.name)
   assert.ok(end.position[1]>-3,'do not fall below campus road on '+choice.name)
   assert.ok(track.collisionStats.activeBodies<350,'bounded collision for '+choice.name)
  }finally{track.destroy();sim.destroy()}
 }
})
test('crossing lines without a shared node never become drive-network links',()=>{
 const sample={roads:[
  {id:'a',campus:true,kind:'service',width:5,points:[[0,-20],[0,20]]},
  {id:'b',campus:true,kind:'service',width:5,points:[[-20,0],[20,0]]},
  {id:'c',campus:true,kind:'service',width:5,points:[[0,20],[0,40]]},
  {id:'foot',campus:true,kind:'footway',width:5,points:[[0,20],[0,40]]}
 ]}
 const net=createCampusRoadNetwork(sample,{startRoadId:'a'})
 assert.deepEqual(net.roads.map(x=>x.id),['a','c'])
 assert.equal(net.sourceRoadCount,3)
 assert.equal(net.lengthMeters,60)
 assert.equal(nearestRoad(net,[1,8]).id,'a')
 assert.ok(roadDistance(net,[70,70])>20)
})
test('shared intersections with differing point arrays join only at exact OSM vertex',()=>{
 const testData={roads:[
 {id:'a',campus:true,kind:'service',width:5,points:[[0,0],[0,20],[0,40]]},
 {id:'b',campus:true,kind:'service',width:5,points:[[0,20],[25,20]]},
 {id:'c',campus:true,kind:'service',width:5,points:[[.3,40],[30,40]]}
 ]}
 assert.deepEqual(createCampusRoadNetwork(testData,{startRoadId:'a'}).roads.map(x=>x.id),['a','b'])
})
test('streamed colliders cover nearby junctions, expire far away and leave no stale Cannon bodies',()=>{
 const net=createCampusRoadNetwork(data)
 const course=planCampusDrive(data)
 const sim=createRacingPhysics({spawn:course.spawn,heading:course.heading})
 const baseline=sim.world.bodies.length
 const track=createStreamedRoadColliders({physics:sim,network:net,data,radius:130,refreshDistance:30})
 try{
  const first=track.update(course.spawn)
  assert.ok(first.roadSlabs>=10)
  assert.ok(first.roadSlabs<net.segments.length/2,'do not instantiate whole campus')
  assert.ok(first.buildingEdges>0)
  assert.ok(track.proxies.length===first.activeBodies)
  const count=sim.world.bodies.length
  assert.equal(track.update(course.spawn).activeBodies,first.activeBodies)
  assert.equal(sim.world.bodies.length,count,'no duplicate bodies on zero motion')
  for(let i=0;i<130;i++)sim.stepFixed(1/60)
  assert.ok(sim.getState().wheels.filter(w=>w.contact).length>=2,'spawn has real wheel contact')
  const nearCross=track.update([122.855,2.2,38.248])
  assert.ok(nearCross.roadSlabs>0)
  assert.ok(track.nearest([122.855,2.2,38.248]).id)
  const far=track.update([450,2.2,-400])
  assert.ok(far.activeBodies<350,'streaming collider budget')
  assert.equal(track.update([450,2.2,-400]).activeBodies,far.activeBodies)
  const returnStats=track.update(course.spawn)
  assert.equal(returnStats.activeBodies,first.activeBodies,'return does not leak')
 }finally{
  track.destroy();track.destroy()
  assert.equal(sim.world.bodies.length,baseline)
  sim.destroy()
 }
 assert.equal(JSON.stringify(data),original)
})
test('tree bodies retain stable identity when collider window moves',()=>{
 const net=createCampusRoadNetwork(data),course=planCampusDrive(data)
 const sim=createRacingPhysics({spawn:course.spawn,heading:course.heading})
 const sample=[
  {x:127,z:-15},{x:128,z:-26},{x:127,z:-300}
 ]
 const stream=createStreamedRoadColliders({physics:sim,network:net,data:{buildings:[]},trees:sample,radius:65,refreshDistance:10})
 try{
  stream.update([122,2,-13])
  const old=stream.proxies.find(x=>x.kind==='tree')
  assert.ok(old,'first tree used as obstacle')
  stream.update([122,2,-290])
  const current=stream.proxies.find(x=>x.kind==='tree')
  assert.ok(current,'new tree used as obstacle')
  assert.ok(current.body.position.z<-250,'new collider must refer to new tree rather than reused old index')
 }finally{stream.destroy();sim.destroy()}
})
test('stream supports a second physical route connected through the OSM node',()=>{
 const net=createCampusRoadNetwork(data)
 const crossing=net.roads.find(x=>x.id==='way/264273581/0')
 assert.ok(crossing,'documented east-west link at north end')
 const sim=createRacingPhysics({spawn:[122.855,2.3,38.248],heading:Math.PI/2})
 const track=createStreamedRoadColliders({physics:sim,network:net,data,radius:120})
 try{
  track.update([122.855,2.3,38.248])
  sim.setInput({throttle:1})
  for(let i=0;i<140;i++){track.update(sim.getState().position);sim.stepFixed(1/60)}
  const v=sim.getState()
  assert.ok(v.position[0]>127,'vehicle physically moves east along mapped crossroad')
  assert.ok(v.wheels.some(x=>x.contact),'drives across road junction without falling')
 }finally{track.destroy();sim.destroy()}
})
