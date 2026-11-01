import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {planCampusDrive} from '../src/racing/campus-track.js'
import {createCampusRoadNetwork,listDriveStartingRoads} from '../src/racing/road-network.js'
import {createDriveSafetyGuard} from '../src/racing/free-roam.js'
import {createRacingPhysics} from '../src/racing/physics.js'
import {createStreamedRoadColliders} from '../src/racing/network-physics.js'
const data=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'))
const original=JSON.stringify(data)
const safe=createDriveSafetyGuard(data,{spawn:[122.64,2.3,-1.52]})
test('Wenzhi Road start is inside actual campus, not the out-of-bound OSM tip',()=>{
 const drive=planCampusDrive(data,{roadId:'way/148313518/0'})
 assert.equal(safe.classify(drive.spawn).allowed,true,'no immediate R22 safety rejection')
 assert.ok(drive.spawn[0]>-401,'start should be on internal segment, not campus-edge protrusion')
 assert.equal(drive.name,'文治路')
})
test('all six named starts are inside campus and physical wheels contact local ground',()=>{
 const network=createCampusRoadNetwork(data)
 const choices=listDriveStartingRoads(network)
 assert.equal(choices.length,6)
 for(const choice of choices){
  const drive=planCampusDrive(data,{roadId:choice.id})
  assert.equal(safe.classify(drive.spawn).allowed,true,choice.name+' should not crash on entry')
  const sim=createRacingPhysics({spawn:drive.spawn,heading:drive.heading})
  const track=createStreamedRoadColliders({physics:sim,network,data,radius:110})
  try{
   track.update(drive.spawn)
   for(let i=0;i<95;i++)sim.stepFixed(1/60)
   assert.ok(sim.getState().wheels.filter(w=>w.contact).length>=2,choice.name+' real contact')
  }finally{track.destroy();sim.destroy()}
 }
})
test('existing normal first-segment spawn is not changed',()=>{
 const east=planCampusDrive(data,{roadId:'way/148313517/0'})
 assert.ok(Math.abs(east.spawn[0]-122.64284)<.001)
 assert.ok(Math.abs(east.spawn[2]-(-1.52096))<.001)
})
test('rejects road if all its OSM segments lie outside campus instead of spawning into invalid state',()=>{
 const invalid={...data,roads:[{id:'way/elsewhere',name:'Outside',kind:'service',campus:true,width:5,points:[[1500,1500],[1550,1500]]}]}
 assert.throws(()=>planCampusDrive(invalid,{roadId:'way/elsewhere'}),/campus|spawn|boundary/i)
})
test('surface policy keeps water protection and OSM data read-only',()=>{
 for(const surface of data.surfaces.filter(s=>s.kind==='water')){
  const p=surface.points.find(x=>safe.classify([x[0]+.1,2,x[1]+.1]).reason==='water')
  if(p)assert.equal(safe.classify([p[0]+.1,2,p[1]+.1]).reason,'water')
 }
 assert.equal(JSON.stringify(data),original)
})
