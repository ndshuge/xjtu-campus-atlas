import test from 'node:test'
import assert from 'node:assert/strict'
import {createCampusRoadNetwork} from '../src/racing/road-network.js'
import {createStreamedRoadColliders} from '../src/racing/network-physics.js'
import {createRacingPhysics} from '../src/racing/physics.js'
import {BASE} from '../src/geo.js'
import {mappedRoadSurfaceHeight} from '../src/racing/road-surface.js'
const roads=[
 {id:'a',campus:true,kind:'unclassified',name:'梧桐东道',width:7,points:[[0,-20],[0,0],[0,20]]},
 {id:'b',campus:true,kind:'service',width:5,points:[[-20,0],[0,0],[20,0]]}
]
const sample={roads,buildings:[]}
const network=()=>createCampusRoadNetwork(sample,{startRoadId:'a'})
test('physics road tops exactly follow the existing *visual* atlas surface heights',()=>{
 assert.equal(mappedRoadSurfaceHeight(roads[0]),BASE+.145)
 assert.equal(mappedRoadSurfaceHeight(roads[1]),BASE+.125)
 const sim=createRacingPhysics({spawn:[0,2,0]})
 const track=createStreamedRoadColliders({physics:sim,network:network(),data:sample,radius:65})
 try{
  track.update([0,2,0])
  for(const r of roads){
   const slabs=track.proxies.filter(p=>p.kind==='road'&&p.id.startsWith('road-'+r.id+':'))
   assert.ok(slabs.length>=2)
   for(const p of slabs){
    const actualTop=p.body.position.y+p.body.shapes[0].halfExtents.y
    assert.ok(Math.abs(actualTop-mappedRoadSurfaceHeight(r))<1e-6,r.id+' surface top mismatch '+actualTop)
   }
  }
 }finally{track.destroy();sim.destroy()}
})
test('junction pad is added only at a shared mapped vertex and follows collider lifecycle',()=>{
 const sim=createRacingPhysics({spawn:[0,2,0]})
 const track=createStreamedRoadColliders({physics:sim,network:network(),data:sample,radius:65,refreshDistance:12})
 const initial=sim.world.bodies.length
 try{
  const stats=track.update([0,2,0])
  assert.equal(stats.junctionPads,1,'single true shared junction')
  const pad=track.proxies.find(x=>x.kind==='junction')
  assert.ok(pad)
  assert.ok(Math.hypot(pad.body.position.x,pad.body.position.z)<.001)
  assert.ok(pad.body.shapes[0].radiusTop>2)
  assert.equal(track.update([0,2,0]).activeBodies,stats.activeBodies)
  const moved=track.update([0,2,200])
  assert.equal(moved.junctionPads,0,'out of range junction must unload')
  assert.ok(sim.world.bodies.length<initial+8)
 }finally{track.destroy();track.destroy();assert.equal(sim.world.bodies.length,initial);sim.destroy()}
})
test('crossing visually without shared OSM vertex does not invent a phantom junction',()=>{
 const fake={roads:[
  {id:'a',campus:true,kind:'service',width:5,points:[[0,-20],[0,20]]},
  {id:'b',campus:true,kind:'service',width:5,points:[[-20,0],[20,0]]}
 ],buildings:[]}
 const sim=createRacingPhysics({spawn:[0,2,0]})
 const n=createCampusRoadNetwork(fake,{startRoadId:'a'})
 const track=createStreamedRoadColliders({physics:sim,network:n,data:fake,radius:65})
 try{assert.equal(track.update([0,2,0]).junctionPads,0)}finally{track.destroy();sim.destroy()}
})
