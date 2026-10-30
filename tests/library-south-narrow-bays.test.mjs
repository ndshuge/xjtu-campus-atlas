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

test('one photo-informed south-tier wing row has closely spaced narrow recessed windows, not large square openings',()=>{
 const asset=createLibraryAsset({building,buildingIndex:0,baseY:1.1});
 try{
  assert.equal(asset.children.length,7,'Keep existing batched draw calls');
  assert.deepEqual(asset.userData.southNarrowBays?.courses,['south-course-2']);
  assert.equal(asset.userData.southNarrowBays?.estimated,true);
  const wall=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ wall'));
  const glass=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ glass'));
  assert.ok(wall&&glass);
  asset.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(),y=1.1+tier.bottom+(tier.top-tier.bottom)/4;
  const front=tier.rect[3],cx=plan.centerX,half=tier.glass/2;
  const aperture=(x)=>{
   ray.set(new THREE.Vector3(x,y,front+20),new THREE.Vector3(0,0,-1));
   const gh=ray.intersectObject(glass,false)[0];
   const wh=ray.intersectObject(wall,false)[0];
   return Boolean(gh&&Math.abs(gh.point.z-(front-.28))<.06&&(!wh||wh.point.z<gh.point.z-.005));
  };
  for(const side of [-1,1]){
   const start=side===1?cx+half+1:tier.rect[0]+1;
   const end=side===1?tier.rect[2]-1:cx-half-1;
   let count=0,last=false;
   for(let x=start;x<end;x+=.12){const hit=aperture(x);if(hit&&!last)count++;last=hit;}
   assert.ok(count>=9,`Expected >=9 narrow recessed apertures in ${side} wing, found ${count}`);
  }
  assert.equal(asset.userData.osmId,263624481);
 }finally{asset.dispose();}
});

test('neutral massing omits authored narrow-bay facade detail',()=>{
 const asset=createLibraryAsset({building,stage:'massing'});
 try{assert.equal(asset.userData.southNarrowBays,null);}finally{asset.dispose();}
});
