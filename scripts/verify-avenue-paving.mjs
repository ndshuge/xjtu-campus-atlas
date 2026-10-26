import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {avenuePavingGeometry} from '../src/avenue-paving.js';
const data=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const paved=avenuePavingGeometry(data.roads);
assert.equal(paved.roadName,'梧桐东道');
assert(paved.length>200,'Missing road segment length');
assert.equal(paved.sidewalks.length,2,'Two side paths expected');
assert.equal(paved.edges.length,2,'Road edge marks expected');
for(const geom of [...paved.sidewalks,...paved.edges]){
  assert(geom&&geom.attributes.position.count>=4,'Invalid road-strip geometry');
  assert([...geom.attributes.position.array].every(Number.isFinite),'Nonfinite road vertices');
  assert(geom.index?.count>0,'Road geometry not indexed');
}
console.log(JSON.stringify({passed:true,name:paved.roadName,lengthMetres:paved.length,walkways:paved.sidewalks.length,edges:paved.edges.length,status:paved.note}));
