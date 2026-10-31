import test from 'node:test';
import assert from 'node:assert/strict';
import {getBuildingMaterialProfile,validateMaterialProfile} from '../src/building-material-evidence.js';
test('library facade profile resolves to a documented material sample while absent ids keep renderer fallback',()=>{
 const p=getBuildingMaterialProfile(263624481);
 assert.equal(p.osmId,263624481);
 assert.equal(p.families.wall,'stone');
 assert.equal(p.wallColor,'#c3bdb3');
 assert.ok(p.sourceUri.startsWith('https://commons.wikimedia.org/'));
 assert.equal(p.confidence,'photo-estimated');
 assert.equal(getBuildingMaterialProfile(999999999),null);
});
test('reject undocumentable color or empty provenance; returned profiles cannot edit shared data',()=>{
 const p=getBuildingMaterialProfile(263624481);
 assert.throws(()=>validateMaterialProfile({...p,wallColor:'blue-ish'}),/wallColor/);
 assert.throws(()=>validateMaterialProfile({...p,sourceUri:''}),/sourceUri/);
 assert.throws(()=>validateMaterialProfile({...p,confidence:'surveyed'}),/confidence/);
 p.families.wall='bright-magenta';
 assert.equal(getBuildingMaterialProfile(263624481).families.wall,'stone');
});
test('six photo-reference-supported landmark material records are distinct and attributable',()=>{
 const ids=[263624481,263624057,263632364,263624056,263625085,1167525875];
 const records=ids.map(id=>getBuildingMaterialProfile(id));
 assert.equal(records.filter(Boolean).length,6);
 assert.ok(new Set(records.map(r=>r.osmId)).size===6);
 for(const r of records){
  assert.doesNotThrow(()=>validateMaterialProfile(r));
  assert.equal(r.confidence,'photo-estimated');
  assert.ok(r.license?.length>5);
 }
});
