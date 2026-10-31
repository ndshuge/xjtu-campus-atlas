import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createLibraryAsset} from '../src/library-asset.js';
import {libraryAssetPlan} from '../src/library-asset-plan.js';

const source=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const building=source.buildings.find(b=>b.osmId===263624481);
const plan=libraryAssetPlan(building);
const top=plan.courses.at(-1);
test('top clock shoulders have a physical hipped stone roof rather than a flat window wall',()=>{
 const asset=createLibraryAsset({building,baseY:1.1,buildingIndex:0});
 try {
  assert.equal(asset.children.length,7);
  assert.equal(asset.userData.clockCrown.roofForm,'pitched-stone-shoulders');
  assert.equal(asset.userData.clockCrown.estimated,true);
  assert.ok(asset.userData.clockCrown.eaveY > top.bottom+1 && asset.userData.clockCrown.eaveY <top.bottom+2);
  const wall=asset.children.find(m=>m.name.endsWith('/ wall'));
  asset.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(new THREE.Vector3(plan.centerX+8,1.1+top.bottom+4.7,top.rect[3]+20),new THREE.Vector3(0,0,-1));
  const hits=ray.intersectObject(wall,false);
  assert.ok(hits.length,'Actual stone roof must intersect frontal ray');
  assert.ok(hits[0].point.z < top.rect[3]-.4,'Upper stone shoulder surface must slope back toward roof, not remain the original vertical wall');
  const bbox=new THREE.Box3().setFromObject(asset);
  assert.ok(bbox.max.y<=1.1+49.75+.001,'Existing 49.75m building cap retained');
 }finally{asset.dispose();}
});
test('pitched front has recessed real black roof apertures, retaining stone between them',()=>{
 const asset=createLibraryAsset({building,baseY:1.1,buildingIndex:0});
 try {
  const glass=asset.children.find(m=>m.name.endsWith('/ glass'));
  assert.equal(asset.userData.southCrownWindows?.roofSkylights,7);
  const front=top.rect[3],y=1.1+top.bottom+3.05;
  const ray=new THREE.Raycaster();
  for(const sign of [-1,1]){
   const x=plan.centerX+sign*5.5;
   ray.set(new THREE.Vector3(x,y,front+15),new THREE.Vector3(0,0,-1));
   const hits=ray.intersectObject(glass,false);
   assert.ok(hits.some(h=>h.point.z<front-.3&&h.point.z>front-2),'Inset glazing must follow pitched south roof on both sides');
  }
 }finally{asset.dispose();}
});
