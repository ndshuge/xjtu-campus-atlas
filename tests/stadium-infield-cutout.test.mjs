import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {BASE} from '../src/geo.js';
import {findStadiumInfield,createStadiumTrackGeometry} from '../src/stadium-infield.js';
const data=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const stadium=data.surfaces.find(s=>s.name==='东田径场');
const football=data.surfaces.find(s=>s.sport==='soccer'&&s.name==='');
test('use the real OSM soccer field inside the east stadium, not a fabricated rectangle',()=>{
 const found=findStadiumInfield(stadium,data.surfaces);
 assert.equal(found,football);
 assert.equal(found.points.length,football.points.length);
 assert.ok(football.points.every(([x,z])=>x>135&&x<255&&z>-164&&z<31));
});
test('one track mesh has a geometric hole: no coincident paint over the OSM soccer pitch',()=>{
 const geom=createStadiumTrackGeometry(stadium,data.surfaces,BASE+.065);
 try{
  assert.ok(geom.isBufferGeometry);
  const red=new THREE.Mesh(geom,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
  red.updateMatrixWorld(true);
  const ray=new THREE.Raycaster();
  const hits=(x,z)=>{ray.set(new THREE.Vector3(x,15,z),new THREE.Vector3(0,-1,0));return ray.intersectObject(red,false).length};
  const [fx,fz]=football.center;
  assert.equal(hits(fx,fz),0,'Football interior is NOT covered by red track triangles');
  assert.ok(hits(140,-60)>0,'Surrounding running track stays visible within the OSM perimeter');
  assert.equal(hits(280,-60),0,'No red paint outside stadium OSM boundary');
 }finally{geom.dispose();}
});
test('track geometry does not generate bogus cutouts when there is no verified infield',()=>{
 const geom=createStadiumTrackGeometry(stadium,[stadium],BASE+.065);
 try{
  const m=new THREE.Mesh(geom,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
  const ray=new THREE.Raycaster(new THREE.Vector3(190,10,-65),new THREE.Vector3(0,-1,0));
  assert.ok(ray.intersectObject(m).length);
 }finally{geom.dispose();}
});
