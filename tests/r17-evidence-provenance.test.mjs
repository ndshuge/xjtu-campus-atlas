import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateEvidence,validateLedger} from '../src/r17-evidence-provenance.js';

const location=new URL('../docs/quality-v2/r17-elevation-material-evidence.json',import.meta.url);
const good={objectId:'library-forecourt',geomType:'multilevel-courtyard',evidenceUri:'https://news.xjtu.edu.cn/info/1079/52073.htm',license:'reference-only',capturedAt:'2016-04-08',coordSystem:'campus-local-xz',elevationDatum:'unknown',sourceKind:'official-photo',confidence:'structure-only',acceptedBy:'R17 source audit',measuredDepthM:null};

test('ledger preserves an unknown sunken depth without inventing a metric level',()=>{
 const ledger=JSON.parse(fs.readFileSync(location,'utf8'));
 assert.ok(ledger.entries.length>=3);
 assert.doesNotThrow(()=>validateLedger(ledger));
 const courtyard=ledger.entries.find(e=>e.objectId==='library-forecourt');
 assert.equal(courtyard.measuredDepthM,null);
 assert.equal(courtyard.confidence,'structure-only');
 assert.ok(ledger.entries.some(e=>e.license==='CC BY-SA 4.0'));
});
test('rejects missing attribution, invented photographic heights and provider extraction',()=>{
 assert.throws(()=>validateEvidence({...good,license:''}),/license/);
 assert.throws(()=>validateEvidence({...good,evidenceUri:''}),/evidenceUri/);
 assert.throws(()=>validateEvidence({...good,measuredDepthM:2.5}),/measuredDepthM/);
 assert.throws(()=>validateEvidence({...good,sourceKind:'amap-extracted'}),/sourceKind/);
 assert.throws(()=>validateEvidence({...good,embeddedImage:'amap-tiles.png'}),/embeddedImage/);
 assert.doesNotThrow(()=>validateEvidence(good));
});
