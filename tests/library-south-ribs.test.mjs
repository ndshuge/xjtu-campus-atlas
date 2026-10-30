import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createLibraryAsset} from '../src/library-asset.js';
import {libraryAssetPlan} from '../src/library-asset-plan.js';

const campus=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const building=campus.buildings.find(b=>b.osmId===263624481);
const plan=libraryAssetPlan(building);

test('photo-informed central south tower has proud stone vertical piers across three visible tiers',()=>{
 const asset=createLibraryAsset({building,buildingIndex:0,baseY:1.1});
 try{
  assert.equal(asset.children.length,7,'Keep the original batching and material budget');
  assert.equal(asset.userData.southFacadeRibs?.estimated,true);
  assert.deepEqual(asset.userData.southFacadeRibs?.courses,['south-course-2','south-course-3','south-course-4']);
  assert.equal(asset.userData.osmId,263624481);
  asset.updateMatrixWorld(true);
  const wall=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ wall'));
  assert.ok(wall);
  const ray=new THREE.Raycaster();
  for(const course of plan.courses.slice(1,4)){
   const y=1.1+(course.bottom+course.top)/2;
   const front=course.rect[3];
   for(const side of [-1,1]){
    const x=plan.centerX+side*course.glass*.25;
    ray.set(new THREE.Vector3(x,y,front+30),new THREE.Vector3(0,0,-1));
    const hit=ray.intersectObject(wall,false)[0];
    assert.ok(hit && hit.point.z>front+.22,`Stone rib missing in ${course.id}, side ${side}: hit ${hit?.point.z}, front ${front}`);
   }
  }
 }finally{asset.dispose();}
});

test('neutral massing does not invent facade rib detail',()=>{
 const asset=createLibraryAsset({building,buildingIndex:0,baseY:1.1,stage:'massing'});
 try{assert.equal(asset.userData.southFacadeRibs,null);}finally{asset.dispose();}
});
