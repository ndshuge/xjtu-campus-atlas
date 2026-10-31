import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createLibraryAsset} from '../src/library-asset.js';
const d=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const b=d.buildings.find(b=>b.osmId===263624481);
test('2025 licensed aerial: long north reading roof has gray weathered surface, within old footprint',()=>{
 const a=createLibraryAsset({building:b,buildingIndex:12,baseY:1.1});
 try{
  assert.equal(a.userData.northRoofPhoto?.source,'library-aerial-2025.jpg');
  assert.equal(a.userData.northRoofPhoto?.estimated,true);
  const mesh=a.children.find(m=>m.isMesh&&m.name.endsWith('/ reveal'));
  assert.ok(mesh,'reuse original gray reveal batch without adding a material');
  const ray=new THREE.Raycaster(new THREE.Vector3(-76,50,-206),new THREE.Vector3(0,-1,0));
  a.updateMatrixWorld(true);
  const hits=ray.intersectObject(mesh,false);
  assert.ok(hits.some(h=>h.point.y>15.1&&h.point.y<16.7),'gray roof physically replaces beige roof at a photo-visible area');
  const [x,y,z]=hits[0].point.toArray();
  assert.ok(x>-91.2&&x<32.95&&z>-219.6&&z<-177.6);
  assert.ok(a.children.filter(m=>m.isMesh&&m.userData.part).length<=7);
 }finally{a.dispose()}
});
test('mass model does not claim photographic roof material',()=>{
 const a=createLibraryAsset({building:b,buildingIndex:12,baseY:1.1,stage:'massing'});
 try{assert.equal(a.userData.northRoofPhoto,null)}finally{a.dispose()}
});
