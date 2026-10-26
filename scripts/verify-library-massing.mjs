import assert from 'node:assert/strict';
import fs from 'node:fs';
import {libraryMassingPlan,libraryEdgeProfile} from '../src/library-massing.js';
import {pointIn,pointSegment,extrude,BASE} from '../src/geo.js';
import {createLibraryGreenRoofs} from '../src/library-green-roofs.js';
const data=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url)));
const lib=data.buildings.find(b=>b.osmId===263624481),original=JSON.stringify(lib.points),plan=libraryMassingPlan(lib.points);
assert(plan&&plan.zones.length===2,'OSM seams no longer match; review the aerial and footprint');
assert.deepEqual(plan.zones.map(z=>z.levels),[4,5]);
assert(plan.status.includes('approximate'),'Inferred floor heights must stay explicit');
const area=ps=>Math.abs(ps.slice(1).reduce((s,p,i)=>s+ps[i][0]*p[1]-p[0]*ps[i][1],0))/2;
let addedPlanArea=0;
for(const z of plan.zones){
 assert.deepEqual(z.points[0],z.points.at(-1));assert(z.height>13&&z.height<20);
 const geometry=extrude(z.points,z.height-plan.baseHeight,BASE+plan.baseHeight),p=geometry.attributes.position;
 assert([...p.array].every(Number.isFinite));addedPlanArea+=area(z.points);
 for(let i=0;i<p.count;i++){
  const q=[p.getX(i),p.getZ(i)],edge=lib.points.slice(1).some((v,j)=>pointSegment(q,lib.points[j],v).distance<.002);
  assert(pointIn(q,lib.points)||edge,'Massing expands the source footprint');
  assert(p.getY(i)>=BASE+13-.002&&p.getY(i)<=BASE+z.height+.002,'Incorrect vertical extent');
 }
}
assert(addedPlanArea<area(lib.points),'North zones cannot occupy the whole library');
assert.equal(JSON.stringify(lib.points),original,'Source footprint mutated');
const rows=lib.points.slice(1).map((p,i)=>libraryEdgeProfile(plan,lib.points[i],p).levels);
assert(rows.includes(3)&&rows.includes(4)&&rows.includes(5),'North/south/stack levels not distinguished');
assert.equal(libraryMassingPlan(lib.points.map(p=>[p[0]+4,p[1]])),null,'Unknown topology must not receive stale seams');
assert.equal(lib.height,49.75,'University maximum height changed');
const roofs=createLibraryGreenRoofs({centerX:lib.center[0],steppedCenterZ:-96.297,baseY:BASE,footprint:lib.points});
const wings=roofs.children.filter(m=>m.name.startsWith('2025 photo-matched'));
assert.equal(wings.length,2,'Both photographed south-wing roofs must be matched');
assert.equal(roofs.children.length,14,'The original twelve terrace strips must remain');
for(const wing of wings){
 assert.equal(wing.material,roofs.children[0].material,'Reuse existing roof material');
 const p=wing.geometry.attributes.position;
 for(let i=0;i<p.count;i++){
  const q=[p.getX(i),p.getZ(i)];assert(pointIn(q,lib.points)||lib.points.slice(1).some((v,j)=>pointSegment(q,lib.points[j],v).distance<.002));
  assert(Math.abs(p.getY(i)-(BASE+13+.045))<.002,'Roof layer changed site elevation');
 }
}
console.log(JSON.stringify({passed:true,zones:plan.zones.map(z=>({id:z.id,levels:z.levels,estimatedHeight:z.height,area:Math.round(area(z.points))})),sourceFootprintUnchanged:true,courtyardAndRaisedBridgeUnchanged:true}));
