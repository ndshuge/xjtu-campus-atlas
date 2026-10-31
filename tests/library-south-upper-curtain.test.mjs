import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createLibraryAsset} from '../src/library-asset.js';
import {libraryAssetPlan} from '../src/library-asset-plan.js';

const campus=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const building=campus.buildings.find(b=>b.osmId===263624481);
const plan=libraryAssetPlan(building);
const tier=plan.courses.find(c=>c.id==='south-course-2');

test('south-course-2 central dark curtain has one structural spandrel and separate recessed panes',()=>{
 const asset=createLibraryAsset({building,buildingIndex:0,baseY:1.1});
 try{
  assert.equal(asset.children.length,7,'Preserve existing architectural batches');
  assert.equal(asset.userData.osmId,263624481);
  assert.equal(asset.userData.southUpperCurtain?.estimated,true);
  assert.deepEqual(asset.userData.southUpperCurtain?.courses,['south-course-2']);
  assert.equal(asset.userData.southUpperCurtain?.mullionColumns,6);
  asset.updateMatrixWorld(true);
  const frame=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ frame'));
  const glass=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ glass'));
  assert.ok(frame&&glass);
  const front=tier.rect[3],x=plan.centerX+.4,mid=(tier.bottom+tier.top)/2;
  const ray=new THREE.Raycaster();
  const hit=(mesh,y)=>{ray.set(new THREE.Vector3(x,1.1+y,front+20),new THREE.Vector3(0,0,-1));return ray.intersectObject(mesh,false)[0];};
  const band=hit(frame,mid);
  assert.ok(band&&band.point.z>front+.10,'Metal spandrel must have real forward depth');
  assert.equal(hit(glass,mid),undefined,'Spandrel must separate glazing, not overlay a continuous dark sheet');
  for(const y of [tier.bottom+1.4,tier.top-1.4]){
   const pane=hit(glass,y);
   assert.ok(pane&&Math.abs(pane.point.z-(front-.30))<.04,'Two glazed fields must recess about 0.30m');
  }
 }finally{asset.dispose();}
});

test('neutral library massing does not invent upper curtain details',()=>{
 const asset=createLibraryAsset({building,stage:'massing'});
 try{assert.equal(asset.userData.southUpperCurtain,null);}finally{asset.dispose();}
});
