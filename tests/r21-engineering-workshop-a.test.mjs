import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEngineeringWorkshopAAsset,ENGINEERING_WORKSHOP_A_ID,ENGINEERING_WORKSHOP_B_ID} from '../src/assets/south/engineering-workshop-a-asset.js';

const campus=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const building=campus.buildings.find(b=>b.osmId===263633887);
test('Workshop A preserves site identity and documents photo-visible facade features',()=>{
 assert.equal(ENGINEERING_WORKSHOP_A_ID,263633887);
 assert.equal(ENGINEERING_WORKSHOP_B_ID,264420412);
 const a=createEngineeringWorkshopAAsset({building,buildingIndex:campus.buildings.indexOf(building)});
 assert.deepEqual(a.userData.osmIds,[ENGINEERING_WORKSHOP_A_ID]);
 assert.equal(a.userData.campusMapSource,'https://vi.xjtu.edu.cn/qt/jddt.htm');
 assert.equal(a.userData.photoSource,'https://xjtu.party/photos');
 assert.equal(a.userData.photoAssetUrl,'https://static.x-research.com/file/xstatic/www/csweb/photos/engineering-workshop.jpg');
 assert.equal(a.userData.photographLabel,'工程坊 A');
 assert.equal(a.userData.orientationStatus,'provisional-OSM-long-edge');
 assert.equal(a.userData.heightStatus,'unmeasured-osm-estimate');
 for(const feature of ['charcoal-concrete-wall','long-black-glazed-ribbon','white-horizontal-spandrel','projecting-upper-volume','vertical-A-sign']){
  assert.ok(a.userData.photoFeatures.includes(feature),feature);
 }
 assert.ok(a.userData.unverifiedFeatures.includes('exact-window-count'));
 const meshes=[];a.traverse(o=>{if(o.isMesh){meshes.push(o);assert.ok(o.geometry.getAttribute('buildingIndex'));}});
 assert.ok(meshes.length>=4);
 a.dispose();
});
test('cannot copy Workshop A facade onto old Workshop B or unrelated campus',()=>{
 const B=campus.buildings.find(b=>b.osmId===ENGINEERING_WORKSHOP_B_ID);
 assert.throws(()=>createEngineeringWorkshopAAsset({building:B,buildingIndex:0}),/263633887/);
 assert.throws(()=>createEngineeringWorkshopAAsset({building:campus.buildings[0],buildingIndex:0}),/263633887/);
});
