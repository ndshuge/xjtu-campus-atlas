import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {BASE} from '../src/geo.js';
import {PLAZA_PAVING} from '../src/plaza-terrain.js';
import {PHOTO_PAVING_INLAYS,createPhotoPavingGeometry} from '../src/plaza-photo-inlays.js';

test('2021 frontal photo: two stone inlay rectangular contours stay inside the mapped paved corridor',()=>{
 assert.equal(PHOTO_PAVING_INLAYS.length,2);
 const {left,right,south,north}=PLAZA_PAVING;
 for(const r of PHOTO_PAVING_INLAYS){
  assert.ok(r.x0>=left&&r.x1<=right&&r.z0>=south&&r.z1<=north);
  assert.ok(r.x1-r.x0>2*r.width&&r.z1-r.z0>2*r.width);
 }
 const g=createPhotoPavingGeometry(BASE+.128);
 try{
  assert.ok(g.isBufferGeometry);
  assert.equal(g.attributes.position.count,8*6,'eight non-overlapping quad strips in one material batch');
  g.computeBoundingBox();
  assert.ok(g.boundingBox.min.y>=BASE+.127&&g.boundingBox.max.y<=BASE+.129,'inlay must be thin pavement paint not ground deformation');
 }finally{g.dispose()}
});
test('photo-estimated lines are visible at inlay borders, but leave open grass/sculpture/centre locations',()=>{
 const g=createPhotoPavingGeometry(BASE+.128);
 const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
 try{
  const ray=new THREE.Raycaster();
  const hit=(x,z)=>{ray.set(new THREE.Vector3(x,BASE+10,z),new THREE.Vector3(0,-1,0));return ray.intersectObject(mesh).length>0};
  assert.equal(hit(-32,-35.75),true,'outer photographed horizontal strip');
  assert.equal(hit(-44+0.22,-20),true,'inner strip is visible');
  assert.equal(hit(-32,-19),false,'centre court remains plain walkable pavement');
  for(const x of [-49.32,-13.32])for(const z of [-18,10])assert.equal(hit(x,z),false,'inlays must not cover sculpture landing discs');
  for(const x of [-70.3,7.3])for(const z of [-31,-1])assert.equal(hit(x,z),false,'no decorative stripe across green planting pockets');
 }finally{g.dispose();mesh.material.dispose()}
});
