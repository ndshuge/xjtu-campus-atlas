import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createLibraryAsset} from '../src/library-asset.js';
import {libraryAssetPlan} from '../src/library-asset-plan.js';

const campus=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const building=campus.buildings.find(b=>b.osmId===263624481);
const plan=libraryAssetPlan(building);

test('photo-informed crown gives the upper stone support a wider, taller silhouette while retaining 49.75m cap',()=>{
 const top=plan.courses.at(-1),below=plan.courses.at(-2);
 assert.ok(top.rect[2]-top.rect[0]>=20&&top.rect[2]-top.rect[0]<=22,'2021 frontal top support is not the old narrow 17m box');
 assert.ok(top.top>=44.5&&top.top<=45,'Clock must transition from the raised upper roof, not the old 42.75m slab');
 assert.equal(top.bottom,below.top,'Stepped tiers must remain connected');
 const asset=createLibraryAsset({building,baseY:1.1,buildingIndex:0});
 try{
  const crown=asset.userData.clockCrown;
  assert.equal(crown?.photoInformed,true);
  assert.equal(crown?.estimated,true);
  assert.equal(crown?.supportRoofY,top.top);
  assert.ok(crown.clockHeight>=4.7&&crown.clockHeight<=5.3,'Clock should no longer dominate the last stone tier');
  assert.ok(Math.abs(crown.supportRoofY+crown.clockHeight-49.75)<.001,'Retain documented height ceiling');
  assert.equal(asset.children.length,7,'Preserve existing architectural batches');
  const bbox=new THREE.Box3().setFromObject(asset);
  assert.ok(bbox.max.y<=1.1+49.75+.001);
 }finally{asset.dispose();}
});

test('upper stone shoulders physically reach the clock transition; neutral massing shares silhouette without estimated detail',()=>{
 const cx=plan.centerX;
 for(const stage of ['material','massing']){
  const asset=createLibraryAsset({building,baseY:1.1,buildingIndex:0,stage});
  try{
   asset.updateMatrixWorld(true);
   const ray=new THREE.Raycaster(new THREE.Vector3(cx+9.5,1.1+43.6,0),new THREE.Vector3(0,0,-1));
   const hits=ray.intersectObject(asset,true).filter(h=>h.point.z>-140&&h.point.z<0);
   assert.ok(hits.length,'Raised top-tier stone shoulder must be physical in '+stage);
   assert.equal(asset.userData.osmId,263624481);
   if(stage==='massing')assert.equal(asset.userData.clockCrown,null,'Neutral mode omits inferred crown detailing');
  }finally{asset.dispose();}
 }
});
