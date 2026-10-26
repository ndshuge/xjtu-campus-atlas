import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createBuildingSilhouettes,BUILDING_IDS} from '../src/building-silhouettes.js';

const buildings=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8')).buildings;
const by=id=>buildings.find(b=>b.osmId===id);
for(const id of [BUILDING_IDS.library,BUILDING_IDS.science,BUILDING_IDS.mainE,...BUILDING_IDS.mainWings])
  assert(by(id),`Missing authoritative OSM building ${id}`);
assert.equal(by(BUILDING_IDS.library).height,49.75,'Source university maximum height changed');
const overlay=createBuildingSilhouettes(buildings);
assert.equal(overlay.children.length,3,'Expected library north/main four wings/Yifu refinements');
assert.equal(overlay.userData.noSubsurfaceInference,true);
let meshes=0,triangles=0;
for(const part of overlay.children) {
  assert(part.children.length>0,`Empty building augmentation ${part.name}`);
  const box=new THREE.Box3().setFromObject(part);
  assert(box.min.y>=1.09,`Underground intrusion: ${part.name} ${box.min.y}`);
  assert(box.min.x>-180 && box.max.x<115 && box.min.z>-225 && box.max.z<210,`Unexpectedly distant/oversized facade: ${part.name}`);
  assert(box.max.y<30,`Facades must not invent a taller tower: ${part.name}`);
  for(const mesh of part.children){
    assert(mesh.isMesh);
    const geo=mesh.geometry;
    for(const value of geo.attributes.position.array)assert(Number.isFinite(value),'Non-finite mesh vertex');
    assert(geo.boundingSphere?.radius>0);
    triangles+=geo.attributes.position.count/3;meshes++;
  }
}
assert(overlay.children[0].userData.modeled===4);
assert(overlay.children[1].userData.sunkenCourtyard==='not modeled');
assert(overlay.children[1].userData.officialSouthHeight===49.75);
assert(overlay.children[2].userData.edges>=1);
const world=fs.readFileSync(new URL('../src/world.js',import.meta.url),'utf8');
assert(world.includes("import {createBuildingSilhouettes} from './building-silhouettes.js'"),'Building model not imported into production world');
assert(world.includes('this.buildingSilhouettes=createBuildingSilhouettes(this.data.buildings)'),'Building model not installed in production scene');
assert(meshes>=9,'Expected material-batched facades');
console.log(JSON.stringify({passed:true,buildingIds:[BUILDING_IDS.library,BUILDING_IDS.science,...BUILDING_IDS.mainWings],meshes,triangles,subsurface:false,productionWorldIntegrated:true}));
