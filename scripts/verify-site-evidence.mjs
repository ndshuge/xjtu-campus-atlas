import assert from 'node:assert/strict';
import fs from 'node:fs';
const registry=JSON.parse(fs.readFileSync(new URL('../docs/quality-v2/campus-site-evidence.json',import.meta.url),'utf8'));
const sources=new Map(registry.references.map(r=>[r.id,r]));
assert.equal(sources.size,registry.references.length,'Duplicate evidence IDs');
for(const source of registry.references){
 assert(source.kind&&source.license&&Object.hasOwn(source,'photographed'),'Missing source provenance');
 if(source.url)assert(/^https:\/\//.test(source.url),'Non HTTPS source URL');
}
const features=new Map(registry.features.map(f=>[f.id,f]));
for(const f of registry.features){
 assert(['P0','P1','P2','P3'].includes(f.priority));
 for(const id of f.evidence)assert(sources.has(id),'Missing evidence '+id);
 if(f.status.startsWith('blocked-'))assert(f.needs.length>0,'Missing unblock requirements');
}
assert(features.get('library-courtyard-true-elevation').status.startsWith('blocked-'),'Unmeasured courtyard marked as finished');
assert(features.get('raised-curved-pedestrian-bridge').status.startsWith('blocked-'),'Unlocated bridge marked as finished');
const forecourt=fs.readFileSync(new URL('../src/library-forecourt.js',import.meta.url),'utf8');
assert(forecourt.includes('non-excavated dark ground indication'),'Existing visual-only courtyard status was silently changed');
console.log(JSON.stringify({passed:true,referenceCount:sources.size,featureCount:features.size,blockedHighPriority:[...features.values()].filter(f=>f.priority==='P0'&&f.status.startsWith('blocked-')).map(f=>f.id)}));
