import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {createCampusVegetation} from '../src/campus-vegetation.js';

// Canvas texture generation is deterministic and does not need a browser GPU
// to test instance-buffer invalidation and LOD transitions.
const ctx={clearRect(){},save(){},translate(){},rotate(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},restore(){}};
globalThis.document={createElement(){return {width:0,height:0,getContext(){return ctx}}}};
const trees=[{x:0,z:0,h:10,r:3.6,c:.1,type:2},{x:400,z:0,h:10,r:3.6,c:.2,type:2}];
const vegetation=createCampusVegetation(trees);
const meshes=vegetation.group.children.filter(x=>x.isInstancedMesh&&x.name.includes('branching'));
const camera={position:new Vector3(0,3,0)};
const versions=()=>meshes.map(m=>m.instanceMatrix.version);
vegetation.update(camera,0,true);
assert.equal(vegetation.group.userData.nearTrees,1);
const initial=versions();
camera.position.x=5;
vegetation.update(camera,1000);
assert.deepEqual(versions(),initial,'unchanged classification must not upload instance buffers');
camera.position.x=400;
vegetation.update(camera,2000);
assert.equal(vegetation.group.userData.nearTrees,1);
const crossed=versions();
assert.ok(crossed.every((v,i)=>v>initial[i]),'crossing a threshold refreshes every affected batch');
vegetation.update(camera,3000,true);
assert.ok(versions().every((v,i)=>v>crossed[i]),'forced refresh rebuilds buffers after context restoration');
console.log('PASS vegetation LOD skips unchanged uploads, refreshes threshold changes and forced restoration');
