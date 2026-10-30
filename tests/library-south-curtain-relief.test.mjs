import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createLibraryAsset} from '../src/library-asset.js';
import {libraryAssetPlan} from '../src/library-asset-plan.js';

const campus=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const building=campus.buildings.find(b=>b.osmId===263624481);
const plan=libraryAssetPlan(building);
const tier=plan.courses.find(c=>c.id==='south-course-1');

test('south-course-1 central glazing is split by a projecting stone transom with genuine recess',()=>{
 const asset=createLibraryAsset({building,buildingIndex:0,baseY:1.1});
 try{
  assert.equal(asset.children.length,7,'Preserve existing material and mesh batching');
  assert.equal(asset.userData.southCurtainRelief?.estimated,true);
  assert.deepEqual(asset.userData.southCurtainRelief?.courses,['south-course-1']);
  assert.equal(asset.userData.osmId,263624481);
  asset.updateMatrixWorld(true);
  const wall=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ wall'));
  const glass=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ glass'));
  assert.ok(wall&&glass);
  const front=tier.rect[3],x=plan.centerX+1.0,mid=(tier.bottom+tier.top)/2;
  const ray=new THREE.Raycaster();
  const hit=(mesh,y)=>{ray.set(new THREE.Vector3(x,1.1+y,front+20),new THREE.Vector3(0,0,-1));return ray.intersectObject(mesh,false)[0];};
  const transom=hit(wall,mid);
  assert.ok(transom&&transom.point.z>front+.15,'Stone spandrel must project in front of the original facade plane');
  assert.equal(hit(glass,mid),undefined,'The stone band must separate two real glazing fields, not overlay a continuous dark plane');
  for(const y of [tier.bottom+1.7,tier.top-1.6]){
   const pane=hit(glass,y);
   assert.ok(pane&&Math.abs(pane.point.z-(front-.36))<.04,'Glass must be set back about 0.36m behind the facade');
  }
 }finally{asset.dispose();}
});

test('neutral massing excludes the new south curtain articulation',()=>{
 const asset=createLibraryAsset({building,stage:'massing'});
 try{assert.equal(asset.userData.southCurtainRelief,null);}finally{asset.dispose();}
});
