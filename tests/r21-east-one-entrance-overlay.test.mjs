import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEastOneEntranceOverlay,EAST_ONE_ID,INSULATION_BUILDING_ID} from '../src/assets/south/east-one-entrance-overlay.js';
import {EAST_HISTORIC_IDS,createEastHistoricAsset} from '../src/east-historic-asset.js';
import {Z_NEGATIVE_ASSET_IDS} from '../src/assets/south/index.js';
const d=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const b=d.buildings.find(b=>b.osmId===263625677);
test('East One overlays its existing historic asset, never substitutes an insulation lab',()=>{
 assert.equal(EAST_ONE_ID,263625677);
 assert.equal(INSULATION_BUILDING_ID,264414271);
 assert.ok(EAST_HISTORIC_IDS.includes(EAST_ONE_ID));
 assert.ok(!Z_NEGATIVE_ASSET_IDS.includes(EAST_ONE_ID),'the existing historic asset must remain the sole whole-building owner');
 const original=createEastHistoricAsset({buildings:[b]});
 assert.ok(original.children.length>=3);
 const detail=createEastOneEntranceOverlay({building:b,buildingIndex:d.buildings.indexOf(b)});
 assert.deepEqual(detail.userData.osmIds,[EAST_ONE_ID]);
 assert.equal(detail.userData.integrationMode,'OVERLAY_ON_EXISTING_EAST_HISTORIC_ASSET');
 assert.equal(detail.userData.schoolAddressSource,'https://ee.xjtu.edu.cn/lxwm.htm');
 assert.ok(detail.userData.photoSource.includes('commons.wikimedia.org'));
 assert.equal(detail.userData.photoAuthor,'Liuxingy');
 assert.equal(detail.userData.photoLicense,'CC BY-SA 4.0');
 assert.equal(detail.userData.photoToOsmEdgeStatus,'PROVISIONAL_SOUTH_94M_EDGE');
 assert.equal(detail.userData.heightStatus,'unmeasured-osm-estimate');
 for(const f of ['grey-brick','red-metal-glass-portal','light-stone-surround','right-hand-vertical-college-plaque','entrance-steps'])assert.ok(detail.userData.confirmedFeatures.includes(f));
 assert.equal(detail.userData.decorativeLedTickerOmitted,true);
 detail.traverse(o=>{if(o.isMesh)assert.ok(o.geometry.getAttribute('buildingIndex'));});
 original.dispose();detail.dispose();
});
test('cannot attach East One institution entrance on electric insulation building or East Three',()=>{
 for(const id of [264414271,263625678]){
  assert.throws(()=>createEastOneEntranceOverlay({building:d.buildings.find(x=>x.osmId===id),buildingIndex:0}),/263625677/);
 }
});
