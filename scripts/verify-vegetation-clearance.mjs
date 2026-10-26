import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {treeGeometry,fitTreeToBuildings,CROWN_RADIUS_FACTOR,VEGETATION_LOD} from '../src/campus-vegetation.js';
import {createCampusPerimeter,perimeterBlocksPosition} from '../src/campus-perimeter.js';
import {pointIn,pointSegment} from '../src/geo.js';
import {avenuePavingGeometry} from '../src/avenue-paving.js';
const d=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url)));
let triangleCounts={};
for(const kind of ['plane','cedar'])for(const detail of ['near','far']){
 const g=treeGeometry(kind,detail,1996),same=treeGeometry(kind,detail,1996);
 let triangles=0;
 for(const key of ['wood','leaves']){
  const p=g[key].attributes.position;assert(p.count>0&&[...p.array].every(Number.isFinite));
  assert.deepEqual(p.array,same[key].attributes.position.array,'Geometry must be deterministic');
  triangles+=p.count/3;
  if(key==='leaves')for(let i=0;i<p.count;i++)assert(Math.hypot(p.getX(i),p.getZ(i))<=3.6*CROWN_RADIUS_FACTOR,'Clearance envelope smaller than leaf geometry');
 }
 triangleCounts[kind+'-'+detail]=triangles;
 assert(triangles<1500,'Per-tree geometry budget exceeded');
}
assert(triangleCounts['plane-far']<triangleCounts['plane-near']*.55,'LOD must lower geometry cost');
assert(VEGETATION_LOD.hysteresis>10,'LOD switching requires hysteresis');
const wall={height:25,points:[[0,0],[10,0],[10,10],[0,10],[0,0]],holes:[]};
const t=fitTreeToBuildings({x:12,z:5,h:16,r:5,c:.5,type:2},[wall]);
assert(t.clearanceAdjusted&&t.r*CROWN_RADIUS_FACTOR<=1.61,'Crown crosses adjacent tall building');
const low=fitTreeToBuildings({x:12,z:5,h:18,r:5},[{...wall,height:3}]);
assert.equal(low.r,5,'Low roof should not clip a high crown');
const courtyard={height:25,points:[[0,0],[20,0],[20,20],[0,20],[0,0]],holes:[[[5,5],[15,5],[15,15],[5,15],[5,5]]]};
const inner=fitTreeToBuildings({x:7,z:10,h:16,r:5},[courtyard]);
assert(inner.r*CROWN_RADIUS_FACTOR<=1.61,'Courtyard foliage crosses the inner facade');
const perimeter=createCampusPerimeter(d.boundary,[...d.landmarks,...d.pois],1.1,d.roads,d.buildings);
assert(Number.isInteger(perimeter.userData.buildingClearanceGaps),'Building-gap diagnostics unavailable');
// Explicit collision fixtures must force visible gaps even when real OSM snapshots
// happen to contain no remaining boundary/building overlap.
const ring=[[0,0],[120,0],[120,120],[0,120],[0,0]];
const crossingBuilding={points:[[45,-3],[55,-3],[55,3],[45,3],[45,-3]],holes:[]};
const fixture=createCampusPerimeter([ring],[],1.1,[],[crossingBuilding],[{x:80,z:0,trunkRadius:1}]);
assert(fixture.userData.buildingClearanceGaps>0,'Building crossing did not cut perimeter');
assert(fixture.userData.treeClearanceGaps>0,'Surveyed tree crossing did not cut perimeter');
for(const s of fixture.userData.colliderSegments)for(const t of [0,.5,1]){
 const p=[s.a[0]+t*(s.b[0]-s.a[0]),s.a[1]+t*(s.b[1]-s.a[1])];
 assert(!pointIn(p,crossingBuilding.points),'Fixture wall crosses building footprint');
 assert(Math.hypot(p[0]-80,p[1])>=1,'Fixture wall crosses surveyed trunk');
}
for(const s of perimeter.userData.colliderSegments)for(const t of [0,.5,1]){
 const p=[s.a[0]+t*(s.b[0]-s.a[0]),s.a[1]+t*(s.b[1]-s.a[1])];
 for(const b of d.buildings){assert(!pointIn(p,b.points)||(b.holes||[]).some(h=>pointIn(p,h)),'Fence intersects an OSM building');}
}
const segment=perimeter.userData.colliderSegments[0],middle=[(segment.a[0]+segment.b[0])/2,(segment.a[1]+segment.b[1])/2];
assert(perimeterBlocksPosition(perimeter,middle),'Rendered fence must block ground walk');
for(const gate of perimeter.userData.gateClearances)assert(!perimeterBlocksPosition(perimeter,gate.point),'Fence blocks preserved gate '+gate.name);
const avenue=avenuePavingGeometry(d.roads);
assert(avenue.centerline&&[...avenue.centerline.attributes.position.array].every(Number.isFinite),'Documented continuous yellow line absent');
const src=fs.readFileSync(new URL('../src/world.js',import.meta.url),'utf8');
assert(src.includes("r.name!=='梧桐东道'"),'Generic dashed white paint must not overlap the documented yellow line');
assert(src.includes('perimeterBlocksPosition(this.campusPerimeter,point,margin)'),'Ground collision integration missing');
assert(src.includes('this.vegetation?.update(this.camera,now)'),'Distance LOD not updated by camera');
console.log(JSON.stringify({passed:true,triangleCounts,crownClearance:true,fenceBuildingGaps:perimeter.userData.buildingClearanceGaps,remainingWallMetres:perimeter.userData.wallLengthMetres,gateClearanceAndCollision:true,avenueYellowLine:true}));
