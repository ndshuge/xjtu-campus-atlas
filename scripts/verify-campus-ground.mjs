import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {campusSpineGroundGeometry, OFFICIAL_CAMPUS_SPINES} from '../src/campus-road-ground.js';
import {buildFourInventionsPaving,PLAZA_PAVING} from '../src/plaza-terrain.js';
import {pointIn,BASE} from '../src/geo.js';
import * as THREE from 'three';

const data=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const g=campusSpineGroundGeometry(data.roads);
const mapped=data.roads.filter(r=>r.campus&&r.name in OFFICIAL_CAMPUS_SPINES&&r.name!=='梧桐东道');
assert(g.segments.length===mapped.length,'Mapped road segments must be retained exactly');
assert(g.sidewalks.length>30,'Campus spines lost sidewalks');
assert(g.edgings.length>30,'Campus spines lost road edge separation');
assert.deepEqual(g.unavailable.sort(),['学苑东路','学苑西路'],'Unmapped avenues must NOT be invented');
assert(g.maxHeight<BASE+.20,'Ground overlay raised too high');
for(const geo of [...g.sidewalks,...g.edgings]){
  assert(geo.index.count>=6,'Nonempty indexed ribbon');
  assert([...geo.attributes.position.array].every(Number.isFinite),'No floating NaN vertices');
  const y=geo.attributes.position;
  for(let i=0;i<y.count;i++)assert(y.getY(i)>=BASE&&y.getY(i)<BASE+.20,'Overlay remains thin and ground-level');
}
for(const r of g.segments){
 assert(data.roads.find(x=>x.id===r.id&&x.name===r.name),'No synthetic road spines');
 assert(r.mappedLength>15&&r.OSMWidth<=7,'Mapped width/length retained');
}
const scene=new THREE.Scene(),plaza=buildFourInventionsPaving(scene);
assert.equal(PLAZA_PAVING.north,10,'Do not enlarge paving over the building front');
assert.equal(plaza.userData.terrain,'flat, no invented contour or elevation');
const disks=plaza.children.filter(o=>o.name==='Sculpture foundation landing / level retained');
assert.equal(disks.length,4,'Sculptural pads at all four corners');
assert(disks.every(o=>o.geometry.parameters.radius>=3.45),'Sculpture platform fully supported');
assert(disks.every(o=>!data.buildings.some(b=>pointIn([o.position.x,o.position.z],b.points))),
  'Pads may not sit inside a mapped building');
const risky=[];
for(const geo of g.sidewalks){
 const pos=geo.attributes.position;
 for(let i=0;i<pos.count;i+=2){
  const pairs=[[pos.getX(i),pos.getZ(i)],[pos.getX(i+1),pos.getZ(i+1)]];
  const next=i+3<pos.count
   ?[[pos.getX(i+2),pos.getZ(i+2)],[pos.getX(i+3),pos.getZ(i+3)]]
   :pairs;
  for(const t of [0,.25,.5,.75,1])for(const side of [0,.5,1]){
   const a=pairs[0].map((v,k)=>v+(pairs[1][k]-v)*side);
   const b=next[0].map((v,k)=>v+(next[1][k]-v)*side);
   const p=a.map((v,k)=>v+(b[k]-v)*t);
   const building=data.buildings.find(item=>pointIn(p,item.points));
   if(building)risky.push({point:p,id:building.id});
  }
 }
}
console.log(JSON.stringify({passed:true,officialSpines:Object.keys(OFFICIAL_CAMPUS_SPINES).length,
 measuredRoadSegments:g.segments.length,sidewalkPieces:g.sidewalks.length,
 edgePieces:g.edgings.length,unmappedOfficialNames:g.unavailable,
 sculpturePads:disks.length,buildingFootprintVertexOverlap:risky.length,examples:risky.slice(0,6)},null,2));
assert(risky.length<20,'Too many sidewalk vertices within mapped building footprints');
