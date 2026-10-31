import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {createRacingPhysics} from '../src/racing/physics.js'
import {createSyntheticTrack} from '../src/racing/track.js'
import {createGameModeHost} from '../src/game-mode-host.js'

test('isolated training ground shares Atlas coordinates while offsetting collision AND visuals',()=>{
 const origin=[1800,0,1800],sim=createRacingPhysics({spawn:[1800,2.1,1782]}),scene=new THREE.Scene()
 const track=createSyntheticTrack({physics:sim,scene,origin})
 assert.ok(track.proxies.length>=10)
 assert.deepEqual(track.proxies.find(x=>x.id==='flat-road').center,[1800,-0.325,1800])
 assert.ok(scene.children.length>track.proxies.length)
 assert.ok(scene.children.every(x=>x.position.x>1700 && x.position.z>1700))
 for(let i=0;i<150;i++)sim.stepFixed(1/60)
 const state=sim.getState()
 assert.ok(state.wheels.some(w=>w.contact),'must have physical wheel contact')
 assert.ok(state.position[0]>1700 && state.position[2]>1700)
 track.destroy()
 assert.equal(sim.world.bodies.filter(b=>b.mass===0).length,0,'no abandoned static colliders')
 assert.equal(scene.children.length,0,'no abandoned track meshes')
 sim.destroy()
})
test('host restores snapshot after repeated race mode exits',async()=>{
 const state={camera:37,enabled:true},host=createGameModeHost({
 capture:()=>({...state}),restore:s=>Object.assign(state,s)
 })
 let cleanup=0
 host.registerMode({id:'race',onEnter:({onCleanup})=>{state.camera=4;state.enabled=false;onCleanup(()=>cleanup++)}})
 for(let i=0;i<20;i++){assert.equal((await host.enterMode('race')).mode,'race');await host.exitMode();assert.deepEqual(state,{camera:37,enabled:true})}
 assert.equal(cleanup,20)
})

test('real drivetrain accelerates, service brakes, and turns with four wheels',()=>{
 const sim=createRacingPhysics(),track=createSyntheticTrack({physics:sim})
 try{
  for(let i=0;i<100;i++)sim.stepFixed(1/60)
  sim.setInput({throttle:1})
  for(let i=0;i<100;i++)sim.stepFixed(1/60)
  const moving=sim.getState()
  assert.ok(moving.speedKmh>25,'engine produces real road speed')
  sim.setInput({brake:1})
  for(let i=0;i<60;i++)sim.stepFixed(1/60)
  assert.ok(sim.getState().speedKmh<moving.speedKmh*.9,'service brakes reduce chassis velocity')
  sim.reset();sim.setInput({throttle:1,steer:1})
  for(let i=0;i<140;i++)sim.stepFixed(1/60)
  const turned=sim.getState()
  assert.ok(Math.abs(turned.position[0])>2,'steering changes chassis trajectory')
  assert.ok(turned.wheels.length===4,'four independently transformed wheels')
 }finally{track.destroy();sim.destroy()}
})
test('collision proxy stops accelerating chassis before synthetic obstacle',()=>{
 const sim=createRacingPhysics({spawn:[2.4,2.1,-18]}),track=createSyntheticTrack({physics:sim})
 try{
  sim.setInput({throttle:1})
  for(let i=0;i<240;i++)sim.stepFixed(1/60)
  const impact=sim.getState()
  assert.ok(impact.position[2]>3&&impact.position[2]<10,'chassis is blocked by physical obstacle near z=12')
  assert.ok(impact.speedKmh<35,'collision removes road-speed momentum')
 }finally{track.destroy();sim.destroy()}
})
