import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createCampusPerimeter} from '../src/campus-perimeter.js';
const data=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const perimeter=createCampusPerimeter(data.boundary,[...data.landmarks,...data.pois],1.1,data.roads);
const models=perimeter.children;
assert.equal(models.length,5,'Missing wall subcomponents');
assert(models.every(m=>m.isInstancedMesh&&m.count>0),'Walls must have real 3D geometry');
const bases=models.find(m=>m.name.includes('masonry plinth'));
assert(bases.count>100,'Walls not continuous enough to enclose campus');
const matrix=new THREE.Matrix4(),pos=new THREE.Vector3(),quat=new THREE.Quaternion(),scale=new THREE.Vector3();
for(let i=0;i<bases.count;i++){
  bases.getMatrixAt(i,matrix);matrix.decompose(pos,quat,scale);
  for(const gate of perimeter.userData.gateClearances){
    assert(Math.hypot(pos.x-gate.point[0],pos.z-gate.point[1])>=gate.clearance-2.5,
      'Schematic wall would block a gate: '+gate.name);
  }
  assert(scale.y>.5&&scale.z>.2,'Wall is flattened or invisible');
}
assert(perimeter.userData.wallLengthMetres>500,'Perimeter length unrealistic');
assert(perimeter.userData.roadCrossingCount===2,'Two OSM road/boundary crossings must remain passable; review mapped passages if OSM data changes');
assert(perimeter.userData.accuracy.includes('NOT verified'),'Missing accuracy warning');
assert(data.roads.some(r=>r.campus&&r.name==='梧桐东道'),'Mapped avenue absent');
const world=readFileSync(new URL('../src/world.js',import.meta.url),'utf8');
assert(world.includes('this.campusPerimeter=createCampusPerimeter('),'Perimeter not in rendered world');
assert(world.includes('plane tree branching / photo-inspired'),'Plane tree branches not integrated');
assert(world.includes('const avenueTrees=trees.filter(t=>t.type===2)'),'Special avenue trees absent');
console.log(JSON.stringify({passed:true,segments:bases.count,wallMeters:perimeter.userData.wallLengthMetres,
 openGates:perimeter.userData.gateClearances.map(g=>g.name),meshes:models.map(m=>[m.name,m.count]),accuracy:perimeter.userData.accuracy},null,2));
