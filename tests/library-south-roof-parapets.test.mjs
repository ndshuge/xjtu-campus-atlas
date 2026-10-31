import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createLibraryAsset} from '../src/library-asset.js';
import {libraryAssetPlan,cellBoundary} from '../src/library-asset-plan.js';

const campus=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const building=campus.buildings.find(b=>b.osmId===263624481);
const plan=libraryAssetPlan(building);
const wingIds=['south-east-wing','south-west-wing'];

test('photographed south roof gardens have actual low perimeter parapets rather than flat painted edges',()=>{
 const asset=createLibraryAsset({building,buildingIndex:0,baseY:1.1});
 try{
  assert.equal(asset.children.length,7,'Keep existing batched meshes');
  assert.equal(asset.userData.osmId,263624481);
  const meta=asset.userData.southGardenParapets;
  assert.ok(Array.isArray(meta));
  assert.deepEqual(meta.map(x=>x.id).sort(),wingIds.slice().sort());
  for(const entry of meta){
   assert.equal(entry.photoInformed,true);
   assert.equal(entry.estimated,true);
   assert.ok(entry.outerEdges>=4,'At least four external wing edges');
   assert.ok(entry.height>0.3&&entry.height<0.7);
  }
  const wall=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ wall'));
  assert.ok(wall);
  asset.updateMatrixWorld(true);
  const east=plan.zones.find(z=>z.id==='south-east-wing');
  const edge=cellBoundary(east.cells).find(e=>e.length>15&&e.nx>.7&&e.nz<-.6);
  assert.ok(edge,'Find photographed oblique outer edge');
  const x=(edge.a[0]+edge.b[0])/2-edge.nx*.15;
  const z=(edge.a[1]+edge.b[1])/2-edge.nz*.15;
  const ray=new THREE.Raycaster(new THREE.Vector3(x,1.1+15,z),new THREE.Vector3(0,-1,0));
  const hit=ray.intersectObject(wall,false)[0];
  assert.ok(hit&&hit.point.y>1.1+east.top+.24&&hit.point.y<1.1+east.top+.7,
   'Parapet must create real raised geometry at exposed eaves');
 }finally{asset.dispose();}
});

test('massing fallback does not add inferred roof parapets',()=>{
 const asset=createLibraryAsset({building,stage:'massing'});
 try{assert.equal(asset.userData.southGardenParapets,null);}finally{asset.dispose();}
});
