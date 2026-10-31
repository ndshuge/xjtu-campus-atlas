import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createLibraryAsset} from '../src/library-asset.js';
import {libraryAssetPlan} from '../src/library-asset-plan.js';

const campus=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const building=campus.buildings.find(b=>b.osmId===263624481);
const plan=libraryAssetPlan(building);

test('2021 frontal photo: pale masonry panels physically interrupt the middle-tier black curtain',()=>{
 const asset=createLibraryAsset({building,buildingIndex:0,baseY:1.1});
 try{
  assert.equal(asset.children.length,7,'retain original material batch budget');
  assert.equal(asset.userData.osmId,263624481);
  assert.equal(asset.userData.southCurtainMasonry?.source,'library-front-2021.jpg');
  const zone=plan.courses.find(z=>z.id==='south-course-3'),cx=plan.centerX,front=zone.rect[3];
  asset.updateMatrixWorld(true);
  const glass=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ glass'));
  const wall=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ wall'));
  const ray=new THREE.Raycaster();
  const cast=(mesh,x,y)=>{ray.set(new THREE.Vector3(x,1.1+y,front+20),new THREE.Vector3(0,0,-1));return ray.intersectObject(mesh,false)};
  for(const y of [zone.bottom+1.35,zone.top-1.65]){
   assert.ok(cast(wall,cx,y).some(h=>h.point.z>front+.08),'physical central stone must project beyond the original glass plane');
   assert.ok(!cast(glass,cx,y).some(h=>h.point.z>front-.5),'stone must replace front-facing glass rather than mask a continuous sheet');
   for(const s of [-1,1])assert.ok(cast(glass,cx+s*2.4,y).some(h=>h.point.z>front-.5),'adjacent left/right real glass aperture stays open');
  }
 }finally{asset.dispose();}
});

test('photographic masonry remains estimated and does not appear in massing stage',()=>{
 const gray=createLibraryAsset({building,buildingIndex:0,baseY:1.1,stage:'massing'});
 try{assert.equal(gray.userData.southCurtainMasonry,null);assert.equal(gray.userData.osmId,263624481)}
 finally{gray.dispose();}
});
