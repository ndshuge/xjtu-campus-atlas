import test from 'node:test';
import assert from 'node:assert/strict';
import {walkReady, waitForWalkReady, measureWalkDisplacement, measurePostCancelDrift} from '../scripts/qa-walk-settle.mjs';

const state=(x=0,z=0,walkTransition=false)=>({
  mode:'walk',walkTransition,walkStart:[0,0],camera:[x,2,z]
});

test('walkReady rejects an in-flight camera even when mode already says walk',()=>{
  assert.equal(walkReady(state(105,0,true)),false);
  assert.equal(walkReady(state(105,0,false)),false);
  assert.equal(walkReady(state(.12,.08,false)),true);
});

test('waitForWalkReady waits for actual camera arrival, not a fixed sleep',async()=>{
  const samples=[state(105,0,true),state(5,0,true),state(.08,.05,false)];
  let i=0,clock=0;
  const ready=await waitForWalkReady(async()=>samples[Math.min(i++,samples.length-1)],async()=>{clock+=100;},{now:()=>clock,intervalMs:100,timeoutMs:1000});
  assert.deepEqual(ready.camera,[.08,2,.05]);
  assert.equal(i,3);
});

test('waitForWalkReady reports unresolved transition instead of a 105m walk',async()=>{
  let clock=0;
  await assert.rejects(
    waitForWalkReady(async()=>state(105,0,true),async()=>{clock+=100;},{now:()=>clock,intervalMs:100,timeoutMs:200}),
    /walk camera did not settle/i
  );
});

test('walk displacement is measured only after stable entry and reports spawn-relative drift',()=>{
  const before=state(0,0,false),after=state(0,4.2,false);
  assert.equal(measureWalkDisplacement(before,after).metres,4.2);
  assert.equal(measureWalkDisplacement(before,after).fromSpawn,4.2);
  assert.throws(()=>measureWalkDisplacement(state(105,0,true),after),/not settled/i);
  assert.throws(()=>measureWalkDisplacement(before,state(105,0,true)),/still transitioning/i);
});

test('pointercancel must not leave a pressed walking key moving the camera',()=>{
  assert.ok(Math.abs(measurePostCancelDrift(state(0,4,false),state(0,4.05,false))-.05)<1e-6);
  assert.throws(()=>measurePostCancelDrift(state(0,4,false),state(0,6,false)),/movement persisted after pointercancel/i);
});
