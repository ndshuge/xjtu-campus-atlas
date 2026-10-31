import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createLibraryAsset} from '../src/library-asset.js';
import {libraryAssetPlan} from '../src/library-asset-plan.js';

const campus=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const building=campus.buildings.find(b=>b.osmId===263624481);
const plan=libraryAssetPlan(building);
const tier=plan.courses.find(t=>t.id==='south-course-4');

test('upper central dark glass is separated by a solid photographed masonry spine',()=>{
 const asset=createLibraryAsset({building,buildingIndex:0,baseY:1.1});
 try{
  assert.equal(asset.children.length,7,'No separate mesh or draw call');
  assert.equal(asset.userData.osmId,263624481);
  asset.updateMatrixWorld(true);
  const stone=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ wall'));
  const glass=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ glass'));
  const front=tier.rect[3],y=1.1+tier.bottom+2.2;
  const ray=new THREE.Raycaster();
  const hits=(mesh,x)=>{
   ray.set(new THREE.Vector3(x,y,front+20),new THREE.Vector3(0,0,-1));
   return ray.intersectObject(mesh,false);
  };
  const stoneAtCenter=hits(stone,plan.centerX).some(h=>h.point.z>front+.35&&h.point.z<front+.7);
  assert.ok(stoneAtCenter,'Real stone center pier must project in front of upper glazing');
  const faceGlazing=hits(glass,plan.centerX).some(h=>Math.abs(h.point.z-(front-.22))<.04);
  assert.ok(!faceGlazing,'The masonry pier must interrupt the pane itself, not mask one continuous sheet');
  for(const sign of [-1,1]){
   const x=plan.centerX+sign*2.2;
   assert.ok(hits(glass,x).some(h=>Math.abs(h.point.z-(front-.22))<.04),'Both adjacent real panes remain recessed');
  }
 }finally{asset.dispose();}
});
