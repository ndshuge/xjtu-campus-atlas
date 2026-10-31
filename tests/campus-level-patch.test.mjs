import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createIsolatedLevelPatch} from '../src/campus-level-patch.js';
const outer=[[-10,-10],[10,-10],[10,10],[-10,10]],hole=[[-4,-4],[4,-4],[4,4],[-4,4]];
test('fixture surface patch has a real opening over lower level and safe upper rim',()=>{
 const patch=createIsolatedLevelPatch({outer,hole,upperY:1.1,lowerY:-2,kind:'fixture'});
 const origin=(x,z)=>new THREE.Raycaster(new THREE.Vector3(x,10,z),new THREE.Vector3(0,-1,0));
 const at=(x,z)=>origin(x,z).intersectObjects(patch.children,true);
 try {
  assert.ok(at(0,0).some(h=>Math.abs(h.point.y+2)<.001));
  assert.ok(!at(0,0).some(h=>Math.abs(h.point.y-1.1)<.001));
  assert.ok(at(8,8).some(h=>Math.abs(h.point.y-1.1)<.001));
  assert.equal(patch.userData.fixtureOnly,true);
 }finally{patch.traverse(n=>{n.geometry?.dispose();n.material?.dispose?.()})}
});
test('photo-only unmeasured depth cannot instantiate actual 3D excavation',()=>{
 assert.throws(()=>createIsolatedLevelPatch({outer,hole,upperY:1.1,lowerY:null,kind:'photo'}),/verified numeric heights/);
});