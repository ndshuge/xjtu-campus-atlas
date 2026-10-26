import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {avenuePavingGeometry} from '../src/avenue-paving.js';
const data=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const paved=avenuePavingGeometry(data.roads);
assert.equal(paved.roadName,'梧桐东道');
assert(paved.length>200,'Missing road segment length');
assert(paved.sidewalks.length>=2,'Clipped sidewalks must retain both sides');
assert(paved.edges.length>=2,'Clipped road edge marks must remain');
for(const geom of [...paved.sidewalks,...paved.edges]){
  assert(geom&&geom.attributes.position.count>=4,'Invalid road-strip geometry');
  assert([...geom.attributes.position.array].every(Number.isFinite),'Nonfinite road vertices');
  assert(geom.index?.count>0,'Road geometry not indexed');
}
// Junction regression: no Wutong East decorative mesh may cross the other carriageway core.
const crossing=avenuePavingGeometry([
  {id:'avenue',name:'梧桐东道',campus:true,kind:'residential',width:8,points:[[0,-50],[0,50]]},
  {id:'cross',name:'思源路',campus:true,kind:'residential',width:8,points:[[-40,0],[40,0]]}
]);
assert(crossing.sidewalks.length>=2);
for(const geom of [...crossing.sidewalks,...crossing.edges]){
  const a=geom.getAttribute('position');
  for(let i=0;i<a.count;i++)assert(Math.abs(a.getZ(i))>=3.5,'Avenue trim crosses an intersecting carriageway');
}
console.log(JSON.stringify({passed:true,name:paved.roadName,lengthMetres:paved.length,walkways:paved.sidewalks.length,edges:paved.edges.length,status:paved.note}));
