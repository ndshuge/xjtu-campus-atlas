import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createLibraryAsset} from '../src/library-asset.js';
import {libraryAssetPlan} from '../src/library-asset-plan.js';

const campus=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const building=campus.buildings.find(b=>b.osmId===263624481);
const plan=libraryAssetPlan(building);
const top=plan.courses.at(-1);

test('top south tier has short photo-informed windows and taller physical stone spandrels',()=>{
 const asset=createLibraryAsset({building,baseY:1.1,buildingIndex:0});
 try{
  assert.equal(asset.userData.southCrownWindows?.photoInformed,true);
  assert.equal(asset.userData.southCrownWindows?.estimated,true);
  assert.equal(asset.userData.southCrownWindows?.course,'south-course-5');
  assert.ok(asset.userData.southCrownWindows?.bottomStoneHeight>=1.5);
  assert.ok(asset.userData.southCrownWindows?.topStoneHeight>=1.1);
  assert.equal(asset.children.length,7);
  assert.equal(asset.userData.osmId,263624481);
  asset.updateMatrixWorld(true);
  const glass=asset.children.find(m=>m.name.endsWith('/ glass'));
  const wall=asset.children.find(m=>m.name.endsWith('/ wall'));
  assert.ok(glass&&wall);
  const ray=new THREE.Raycaster(),front=top.rect[3];
  const glassAt=(x,y)=>{
   ray.set(new THREE.Vector3(x,1.1+y,front+12),new THREE.Vector3(0,0,-1));
   const gh=ray.intersectObject(glass,false)[0],wh=ray.intersectObject(wall,false)[0];
   // The roof glazing now sits in actual pitched facets, so its Z depth
   // varies with height. Do not accept unrelated glazing behind this roof.
   return Boolean(gh&&gh.point.z<front-.3&&gh.point.z>front-1.5&&(!wh||wh.point.z<gh.point.z-.005));
  };
  const scan=y=>{
   let count=0,last=false;
   for(let x=top.rect[0]+.2;x<top.rect[2]-.2;x+=.10){const current=glassAt(x,y);if(current&&!last)count++;last=current;}
   return count;
  };
  assert.ok(scan(top.bottom+2.8)>=7,'Visible upper window band must be denser than old six openings');
  assert.equal(scan(top.bottom+1.05),0,'Bottom stone spandrel must cover old near-full-height glazing');
  assert.equal(scan(top.top-.8),0,'Upper stone spandrel must cover old tall glazing');
 }finally{asset.dispose();}
});

test('neutral massing preserves silhouette without inferred south crown windows',()=>{
 const asset=createLibraryAsset({building,baseY:1.1,stage:'massing'});
 try{
  assert.equal(asset.userData.southCrownWindows,null);
  assert.equal(asset.userData.osmId,263624481);
  assert.equal(asset.children.length,4,'Neutral stage retains its original four material batches');
 }finally{asset.dispose();}
});
