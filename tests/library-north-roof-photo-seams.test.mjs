import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createLibraryAsset} from '../src/library-asset.js';
import {libraryAssetPlan} from '../src/library-asset-plan.js';

const data=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const building=data.buildings.find(x=>x.osmId===263624481);
test('2025 aerial reveals two dark north-reading-roof section bands within the mapped roof',()=>{
 const before=JSON.stringify(building);
 const asset=createLibraryAsset({building,buildingIndex:0,baseY:1.1});
 try{
  const seams=asset.userData.northRoofPhotoSeams;
  assert.ok(seams && seams.photoInformed && seams.estimated);
  assert.equal(seams.source,'library-aerial-2025.jpg');
  assert.equal(seams.xPositions.length,2);
  assert.ok(seams.xPositions[0]<seams.xPositions[1]);
  assert.equal(JSON.stringify(building),before);
  const roof=libraryAssetPlan(building).zones.find(z=>z.id==='north-reading-block');
  assert.ok(seams.xPositions.every(x=>x>roof.points.reduce((a,p)=>Math.min(a,p[0]),Infinity)&&x<roof.points.reduce((a,p)=>Math.max(a,p[0]),-Infinity)));
  const reveal=asset.children.find(x=>x.isMesh&&x.name.endsWith('/ reveal'));
  const seamMesh=asset.children.find(x=>x.isMesh&&x.name.endsWith('/ glass'));
  assert.ok(reveal&&seamMesh);
  asset.updateMatrixWorld(true);
  const ray=new THREE.Raycaster();
  function upper(mesh,x,z) {
   ray.set(new THREE.Vector3(x,40,z),new THREE.Vector3(0,-1,0));
   return ray.intersectObject(mesh,false).filter(h=>h.point.y>15).map(h=>h.point.y).sort((a,b)=>b-a)[0];
  }
  for(const x of seams.xPositions){
   const y=upper(seamMesh,x,-210),adjacent=upper(reveal,x+1.3,-210);
   assert.ok(y>15.5 && y<17.5,'physically visible on existing roof');
   assert.ok(y-adjacent>.035,'seam lies just above the roof surface instead of buried inside');
  }
  assert.ok(asset.children.filter(m=>m.isMesh&&m.userData.part).length<=7,'reuse the original material batches');
 }finally{asset.dispose()}
});
test('plain massing does not contain undocumented photo seams',()=>{
 const asset=createLibraryAsset({building,buildingIndex:0,stage:'massing'});
 try{assert.equal(asset.userData.northRoofPhotoSeams,null)}finally{asset.dispose()}
});
