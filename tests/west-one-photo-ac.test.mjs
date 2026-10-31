import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createWestOneAsset,WEST_ONE_ID} from '../src/west-one-asset.js';
const campus=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const building=campus.buildings.find(b=>b.osmId===WEST_ONE_ID);
const index=campus.buildings.indexOf(building);
test('West 1 facade photograph: small external AC units physically project from one courtyard wing',()=>{
 const before=JSON.stringify(building);
 const asset=createWestOneAsset({building,buildingIndex:index,baseY:1.1});
 try{
  const evidence=asset.userData.photoFacadeAC;
  assert.ok(evidence,'asset must have photo-informed facade contract');
  assert.equal(evidence.source,'XJTU West 1 Teaching/Office Building, xjtu.party/photos');
  assert.equal(evidence.estimated,true);
  assert.equal(evidence.bayFraction,.89,'place appliance on masonry pier, not window glass');
  assert.ok(evidence.caseWidth<=.65);
  assert.ok(evidence.count>=45 && evidence.count<=95);
  assert.equal(asset.userData.osmIds[0],WEST_ONE_ID);
  assert.equal(JSON.stringify(building),before);
  assert.ok(evidence.units.every(([x,y,z])=>x>-349&&x<-292&&y>1.1&&y<22.11&&z>-518.3&&z<-515.5));
  const meshCount=asset.children.filter(m=>m.isMesh).length;
  assert.ok(meshCount<=5,'AC exterior uses shared existing materials, not individual mesh per unit');
  const stone=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ stone'));
  assert.ok(stone);
  asset.updateMatrixWorld(true);
  const [x,y,z]=evidence.units[8];
  const ray=new THREE.Raycaster(new THREE.Vector3(x,y,z-9),new THREE.Vector3(0,0,1),0,15);
  const hits=ray.intersectObject(stone,false);
  assert.ok(hits.some(h=>h.point.z<z),'box front must be outward of the facade');
 }finally{asset.dispose()}
});
test('massing stage stays a clean silhouette without unmeasured façade appliances',()=>{
 const asset=createWestOneAsset({building,buildingIndex:index,baseY:1.1,stage:'massing'});
 try{assert.equal(asset.userData.photoFacadeAC,null)}finally{asset.dispose()}
});
