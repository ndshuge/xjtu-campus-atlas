import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createDriveSafetyGuard} from '../src/racing/free-roam.js'
import {createRacingPhysics} from '../src/racing/physics.js'
import {pointIn} from '../src/geo.js'
const data=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'))
const start=[122.64,2.3,-1.52]
function findPolygonInterior(poly){
 const minX=Math.min(...poly.map(p=>p[0])),maxX=Math.max(...poly.map(p=>p[0]))
 const minZ=Math.min(...poly.map(p=>p[1])),maxZ=Math.max(...poly.map(p=>p[1]))
 for(let x=minX;x<=maxX;x+=(maxX-minX)/20||1)
  for(let z=minZ;z<=maxZ;z+=(maxZ-minZ)/20||1)
   if(pointIn([x,z],poly))return [x,z]
 throw Error('OSM polygon has no interior sample')
}
test('R22 allows non-road campus areas rather than only route centrelines',()=>{
 const g=createDriveSafetyGuard(data,{spawn:start})
 for(const position of [start,[192,2.4,-68],[-38,2,45]]){
  const a=g.classify(position)
  assert.equal(a.allowed,true,JSON.stringify({position,reason:a.reason}))
 }
})
test('R22 rejects OSM lake polygons and well outside mapped campus',()=>{
 const g=createDriveSafetyGuard(data,{spawn:start})
 for(const lake of data.surfaces.filter(x=>x.kind==='water')){
  const point=findPolygonInterior(lake.points)
  const a=g.classify([point[0],2,point[1]])
  assert.equal(a.allowed,false,lake.id)
  assert.equal(a.reason,'water',lake.id)
 }
 for(const position of [[2100,2,2100],[-600,2,-700],[-900,2,250]]){
  const a=g.classify(position)
  assert.equal(a.allowed,false)
  assert.equal(a.reason,'outside-campus')
 }
})
test('R22 validates inputs and never mutates existing OSM',()=>{
 const original=JSON.stringify(data)
 assert.throws(()=>createDriveSafetyGuard({boundary:[],surfaces:[]},{spawn:start}),/boundary/)
 assert.throws(()=>createDriveSafetyGuard(data,{spawn:[NaN,1,1]}),/spawn/)
 assert.throws(()=>createDriveSafetyGuard(data,{spawn:[2000,2,2000]}),/spawn/)
 const g=createDriveSafetyGuard(data,{spawn:start})
 assert.throws(()=>g.classify([NaN,1,1]),/position/)
 assert.equal(JSON.stringify(data),original)
})
test('R22 actually resets Cannon car when entering lake/outside, never on valid off-road grass',()=>{
 const notices=[]
 const guard=createDriveSafetyGuard(data,{spawn:start,notify:reason=>notices.push(reason)})
 const sim=createRacingPhysics({spawn:start})
 try{
  assert.equal(guard.recover(sim).recovered,false)
  sim.body.position.set(192,2.3,-68)
  assert.equal(guard.recover(sim).recovered,false)
  for(const p of [[-30.390875,2,-291.447125],[2200,2,2200]]){
   sim.body.position.set(...p)
   sim.body.velocity.set(12,0,8)
   const result=guard.recover(sim)
   assert.equal(result.recovered,true)
   assert.ok(Math.abs(sim.body.position.x-start[0])<.01)
   assert.ok(Math.abs(sim.body.position.z-start[2])<.01)
   assert.equal(sim.body.velocity.length(),0)
  }
  assert.deepEqual(notices,['water','outside-campus'])
 }finally{sim.destroy()}
})
