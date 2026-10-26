import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {BASE} from '../src/geo.js';
import {campusSpineGroundGeometry,OFFICIAL_CAMPUS_SPINES} from '../src/campus-road-ground.js';
import {buildFourInventionsPaving,PLAZA_PAVING} from '../src/plaza-terrain.js';
import {createLibraryForecourt} from '../src/library-forecourt.js';

const data=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const plan=campusSpineGroundGeometry(data.roads);
assert.equal(Object.keys(OFFICIAL_CAMPUS_SPINES).length,8);
for(const name of ['梧桐西道','思源路','彭康路','学森路','文治路'])
  assert(plan.found.includes(name),'Mapped main road missing from hardscape: '+name);
assert(plan.unavailable.includes('学苑东路')&&plan.unavailable.includes('学苑西路'),
  'Unmapped main roads must NOT be invented');
assert(plan.sidewalks.length>2 && plan.edgings.length>2);
for(const g of [...plan.sidewalks,...plan.edgings]){
  const a=g.getAttribute('position');
  assert(a.count>3&&g.index.count>0&&[...a.array].every(Number.isFinite));
  for(let i=0;i<a.count;i++)assert(a.getY(i)>=BASE+.184&&a.getY(i)<=BASE+.196,
    'Main-road surface is neither flat nor close to existing asphalt');
}

// Intersections: the separate sidewalk must not cover crossing carriageways.
const synthetic=[
  {id:'x',name:'思源路',kind:'unclassified',campus:true,width:7,points:[[-35,0],[35,0]]},
  {id:'z',name:'梧桐西道',kind:'unclassified',campus:true,width:7,points:[[0,-35],[0,35]]}
];
const cross=campusSpineGroundGeometry(synthetic);
assert(cross.sidewalks.length>=2);
for(const g of cross.sidewalks){
  const a=g.getAttribute('position');
  for(let i=0;i<a.count;i++){
    const x=a.getX(i),z=a.getZ(i);
    assert(!(Math.abs(x)<2.7&&Math.abs(z)<2.7),
      'Pedestrian finish incorrectly crosses the carriageway intersection');
  }
}
const scene=new THREE.Scene();
const courtyard=buildFourInventionsPaving(scene);
assert.equal(courtyard.userData.sculpturalLandings.length,4);
const p=data.interpretive.find(x=>x.id==='interpretive/four-inventions').position;
for(const [x,z] of courtyard.userData.sculpturalLandings){
  assert.equal(Math.abs(x-p[0]),18);
  assert([-18,10].includes(z-p[1]));
}
assert.equal(PLAZA_PAVING.north,10,'Avoid extending paving into the mapped library wing');
assert.match(courtyard.userData.terrain,/no invented contour/);
const rings=courtyard.children.filter(x=>x.name==='Sculpture foundation landing / level retained');
assert.equal(rings.length,4);
assert(rings.every(x=>Math.abs(x.position.y-(BASE+.07))<1e-6));
const seams=courtyard.children.find(x=>x.name==='Limited axial paving expansion seams');
assert.equal(seams.geometry.getAttribute('position').count,8);
const forecourt=createLibraryForecourt({centerX:0,facadeFrontZ:20,baseY:BASE});
assert.equal(forecourt.userData.exteriorRoadAndTerrainUntouched,true);

console.log(JSON.stringify({passed:true,officialSpines:8,availableOnOSM:['梧桐东道',...plan.found],
  missingFromOSM:plan.unavailable,sidewalkRuns:plan.sidewalks.length,edgingRuns:plan.edgings.length,
  pavedSegments:plan.segments,sculpturalPads:rings.length,flatTerrain:true},null,2));
