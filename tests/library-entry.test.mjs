import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createLibraryAsset} from '../src/library-asset.js';
import {libraryAssetPlan,cellBoundary} from '../src/library-asset-plan.js';

const campus=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const building=campus.buildings.find(b=>b.osmId===263624481);
const plan=libraryAssetPlan(building);
const south=plan.zones.find(z=>z.id==='south-II-podium');
const edges=cellBoundary(south.cells).filter(e=>e.nz>.9&&Math.max(e.a[1],e.b[1])>-76);
const mid=(Math.min(...edges.flatMap(e=>[e.a[0],e.b[0]]))+Math.max(...edges.flatMap(e=>[e.a[0],e.b[0]])))/2;
const facadeZ=-75.4;

test('photo-informed southern entry is a recessed glazed door with an articulated stone portal',()=>{
 const asset=createLibraryAsset({building,buildingIndex:0,baseY:1.1});
 try{
  const wall=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ wall'));
  const frame=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ frame'));
  assert.ok(wall&&frame);
  assert.equal(asset.children.length,7,'The portal must use the existing batches and material budget');
  assert.ok(asset.userData.southPortal?.photoInformed,'Entrance composition must be auditable as estimated photo-informed work');
  assert.ok(asset.userData.southPortal.width>=3&&asset.userData.southPortal.width<=4.5);
  asset.updateMatrixWorld(true);
  const ray=new THREE.Raycaster();
  const hitAt=(mesh,x,y)=>{ray.set(new THREE.Vector3(x,y,-65),new THREE.Vector3(0,0,-1));return ray.intersectObject(mesh,false)[0];};
  for(const x of [mid-1.7,mid+1.7]){
   const hit=hitAt(wall,x,1.1+1.8);
   assert.ok(hit&&hit.point.z>facadeZ+.02,'Stone entry jamb must stand proud of the original glazing at x='+x);
  }
  const lintel=hitAt(wall,mid,1.1+3.55);
  assert.ok(lintel&&lintel.point.z>facadeZ+.02,'Stone portal lintel must form a visible entrance silhouette');
  const doorSeam=hitAt(frame,mid,1.1+1.6);
  assert.ok(doorSeam&&doorSeam.point.z>facadeZ+.02,'Glazed double-door center stile must read as foreground frame');
  assert.equal(asset.userData.osmId,263624481);
  assert.equal(asset.userData.estimated,true);
 }finally{asset.dispose();}
});
