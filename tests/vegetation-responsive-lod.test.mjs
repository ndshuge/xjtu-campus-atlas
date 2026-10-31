import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {createCampusVegetation,VEGETATION_LOD} from '../src/campus-vegetation.js';

const context={clearRect(){},save(){},translate(){},rotate(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},restore(){}};
globalThis.document={createElement(){return {width:0,height:0,getContext(){return context}}}};

test('vegetation LOD follows 390→800→390 responsive breakpoint, even with stationary camera',()=>{
 const tree={x:0,z:0,h:10,r:3.6,c:.2,type:2};
 const v=createCampusVegetation([tree],{mobile:true});
 const camera={position:new Vector3(120,1.1,0)};
 try{
  v.update(camera,100,true);
  assert.equal(v.group.userData.nearTrees,0,'mobile 110m cutoff should classify as far');
  v.setMobile(false);
  v.update(camera,200);
  assert.equal(v.group.userData.nearTrees,1,'desktop 170m cutoff must update at same camera position');
  v.setMobile(true);
  v.update(camera,300);
  assert.equal(v.group.userData.nearTrees,0,'mobile must return to far at same camera position');
  assert.equal(VEGETATION_LOD.hysteresis,22);
 }finally{
  v.group.traverse(o=>{if(o.isMesh){o.geometry?.dispose();o.material?.dispose()}});
 }
});

test('no pointless instance-buffer writes when viewport class does not change',()=>{
 const t={x:0,z:0,h:10,r:3.6,c:.2,type:2};
 const v=createCampusVegetation([t],{mobile:true}),camera={position:new Vector3(120,1.1,0)};
 try{
  v.update(camera,100,true);
  const m=v.group.children.filter(m=>m.isInstancedMesh).map(m=>m.instanceMatrix.version);
  v.setMobile(true);
  v.update(camera,500);
  assert.deepEqual(v.group.children.filter(m=>m.isInstancedMesh).map(m=>m.instanceMatrix.version),m);
 }finally{v.group.traverse(o=>{if(o.isMesh){o.geometry?.dispose();o.material?.dispose()}})}
});
