import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createLibraryAsset} from '../src/library-asset.js';
import {libraryAssetPlan} from '../src/library-asset-plan.js';

const campus=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const building=campus.buildings.find(b=>b.osmId===263624481);
const plan=libraryAssetPlan(building);
const tier=plan.courses.find(c=>c.id==='south-course-3');

test('south-course-3 center curtain has recessed upper/lower glazing split by a real horizontal spandrel',()=>{
 const asset=createLibraryAsset({building,buildingIndex:0,baseY:1.1});
 try{
  assert.equal(asset.children.length,7,'Do not create per-window draw-call batches');
  assert.equal(asset.userData.osmId,263624481);
  assert.deepEqual(asset.userData.southCrownCurtain?.courses,['south-course-3']);
  assert.equal(asset.userData.southCrownCurtain?.estimated,true);
  assert.equal(asset.userData.southCrownCurtain?.mullionColumns,6);
  asset.updateMatrixWorld(true);
  const frame=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ frame'));
  const glass=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ glass'));
  assert.ok(frame&&glass);
  const front=tier.rect[3],x=plan.centerX+.2,mid=(tier.bottom+tier.top)/2;
  const ray=new THREE.Raycaster();
  const hit=(mesh,y)=>{
   ray.set(new THREE.Vector3(x,1.1+y,front+25),new THREE.Vector3(0,0,-1));
   return ray.intersectObject(mesh,false)[0];
  };
  const spandrel=hit(frame,mid);
  assert.ok(spandrel&&spandrel.point.z>front+.10,'Band must have real structural depth');
  assert.equal(hit(glass,mid),undefined,'A continuous glass slab must not sit behind the spandrel');
  for(const y of [tier.bottom+1.5,tier.top-1.5]){
   const pane=hit(glass,y);
   assert.ok(pane&&Math.abs(pane.point.z-(front-.29))<.04,'Glazing needs genuine recess');
  }
 }finally{asset.dispose();}
});

test('neutral library massing omits photo-estimated south-course-3 curtain detail',()=>{
 const asset=createLibraryAsset({building,stage:'massing'});
 try{assert.equal(asset.userData.southCrownCurtain,null);}finally{asset.dispose();}
});
