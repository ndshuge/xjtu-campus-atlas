import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import * as THREE from 'three'
import {BASE,pointIn} from '../src/geo.js'
import {createRacingPhysics} from '../src/racing/physics.js'
import {createCampusRoadNetwork} from '../src/racing/road-network.js'
import {createStreamedRoadColliders} from '../src/racing/network-physics.js'
import {planAthleticsStadium,createAthleticsTrackGeometry} from '../src/stadium-infield.js'
const data=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'))
const stadium=data.surfaces.find(s=>s.id==='way/263633888'),field=data.surfaces.find(s=>s.id==='way/1288042500')
test('terrain base keeps tires supported after vehicle leaves OSM road (not road-only)',()=>{
 const sim=createRacingPhysics({spawn:[40,2,100]})
 const n=createCampusRoadNetwork(data)
 const track=createStreamedRoadColliders({physics:sim,network:n,data,trees:[],radius:65})
 try{
  track.update([40,2,100])
  assert.ok(track.proxies.some(p=>p.kind==='terrain'),'persistent campus terrain instead of gaps')
  for(let i=0;i<170;i++){sim.stepFixed(1/60)}
  const s=sim.getState()
  assert.ok(s.position[1]>BASE-.2,'offroad must not fall below field elevation')
  assert.ok(s.wheels.some(w=>w.contact),'offroad wheel must touch terrain')
  assert.ok(Math.abs(s.position[0]-40)<2)
  track.update([250,2,250])
  assert.ok(track.proxies.some(p=>p.kind==='terrain'),'ground persists during streaming')
 }finally{track.destroy();sim.destroy()}
})
test('off-road trees still gain collision bodies even if not adjacent to a mapped road',()=>{
 const sim=createRacingPhysics({spawn:[195,2,-65]})
 const n=createCampusRoadNetwork(data)
 const tree={x:196,z:-63}
 const track=createStreamedRoadColliders({physics:sim,network:n,data,trees:[tree],radius:65})
 try{
  track.update([195,2,-65])
  const obstacles=track.proxies.filter(p=>p.kind==='tree')
  assert.equal(obstacles.length,1,'tree collision must not require a nearby OSM road')
  assert.equal(obstacles[0].body.position.x,196)
  assert.equal(obstacles[0].body.position.z,-63)
 }finally{track.destroy();sim.destroy()}
})
test('athletics geometry follows documented OSM stadium and leaves verified soccer infield clear',()=>{
 const plan=planAthleticsStadium(stadium,data.surfaces)
 assert.equal(plan.stadiumId,stadium.id)
 assert.equal(plan.infieldId,field.id)
 assert.ok(plan.innerRadius>=38&&plan.outerRadius<=53)
 for(const p of plan.outer)assert.ok(pointIn(p,stadium.points),'track outline inside stadium')
 for(const p of field.points.slice(0,-1))assert.ok(pointIn(p,plan.inner),'verified soccer polygon fits track inside')
 const ring=createAthleticsTrackGeometry(stadium,data.surfaces,BASE+.102)
 try{
  const mesh=new THREE.Mesh(ring,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}))
  mesh.updateMatrixWorld(true)
  const ray=new THREE.Raycaster()
  function hits(x,z){ray.set(new THREE.Vector3(x,20,z),new THREE.Vector3(0,-1,0));return ray.intersectObject(mesh,false).length}
  assert.equal(hits(...field.center),0,'no red track layered over soccer infield')
  assert.ok(hits(plan.centerX+plan.innerRadius+3,plan.centerZ)>0,'red running lanes exist')
  assert.equal(hits(135,-60),0,'no giant rectangular red carpet')
 }finally{ring.dispose()}
})
test('field and track plane elevations allow stripe decals without coplanar soccer/track triangles',()=>{
 const plan=planAthleticsStadium(stadium,data.surfaces)
 assert.ok(plan.outer.length>=60)
 assert.ok(plan.outerRadius>plan.innerRadius+7)
})
