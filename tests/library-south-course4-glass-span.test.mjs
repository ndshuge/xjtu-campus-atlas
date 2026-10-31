import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createLibraryAsset} from '../src/library-asset.js';
import {libraryAssetPlan} from '../src/library-asset-plan.js';

const campus=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const building=campus.buildings.find(b=>b.osmId===263624481);
const plan=libraryAssetPlan(building);
const topGlassCourse=plan.courses.find(c=>c.id==='south-course-4');

test('2021 south photograph: high central dark glazing spans most of upper setback, while side stone remains',()=>{
 const ratio=topGlassCourse.glass/(topGlassCourse.rect[2]-topGlassCourse.rect[0]);
 assert.ok(ratio>.60&&ratio<.75,'Upper dark field should occupy around two thirds of upper setback; estimated from licensed 2021 front photo');
 const asset=createLibraryAsset({building,buildingIndex:0,baseY:1.1});
 try {
  assert.equal(asset.children.length,7,'Retain existing material batches');
  assert.equal(asset.userData.osmId,263624481);
  asset.updateMatrixWorld(true);
  const glass=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ glass'));
  const front=topGlassCourse.rect[3],y=1.1+topGlassCourse.bottom+1.7;
  const ray=new THREE.Raycaster();
  const hit=(mesh,x)=>{ray.set(new THREE.Vector3(x,y,front+30),new THREE.Vector3(0,0,-1));return ray.intersectObject(mesh,false)[0];};
  for(const sign of [-1,1]){
   const x=plan.centerX+sign*8;
   const pane=hit(glass,x);
   assert.ok(pane&&Math.abs(pane.point.z-(front-.22))<.04,'Glazing must physically extend into former side wall, still recessed');
  }
 }finally{asset.dispose();}
});
