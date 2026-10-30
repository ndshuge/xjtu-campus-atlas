import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createEastHistoricAsset,EAST_HISTORIC_IDS} from '../src/east-historic-asset.js';
import {bounds,pointIn,BASE} from '../src/geo.js';
import {CampusWorld} from '../src/world.js';

const data=JSON.parse(fs.readFileSync('public/data/campus.json'));
const original=JSON.stringify(data.buildings),asset=createEastHistoricAsset({buildings:data.buildings});
const found=new Set();
asset.traverse(mesh=>{if(!mesh.isMesh)return;assert.equal(mesh.userData.owner,'east-historic-asset.js');
 for(const v of mesh.geometry.attributes.position.array)assert(Number.isFinite(v));
 for(const id of mesh.geometry.attributes.buildingIndex.array)found.add(data.buildings[id].osmId);
});
assert.deepEqual([...found].sort(),[...EAST_HISTORIC_IDS].sort());
asset.updateMatrixWorld(true);
const ray=new THREE.Raycaster(),coverage=[];
for(const id of EAST_HISTORIC_IDS){
 const building=data.buildings.find(b=>b.osmId===id),bb=bounds(building.points);let count=0,hits=0;
 for(let x=bb[0]+1;x<bb[2];x+=6)for(let z=bb[1]+1;z<bb[3];z+=6){if(!pointIn([x,z],building.points))continue;
  count++;ray.set(new THREE.Vector3(x,BASE+building.height+5,z),new THREE.Vector3(0,-1,0));
  const hit=ray.intersectObject(asset,true)[0];if(hit&&hit.object.name.endsWith(' / roof')){hits++;const fake=Object.create(CampusWorld.prototype);fake.data=data;fake.buildingMesh=null;assert.equal(fake.hitPlace(hit).place.id,building.id);}
 }
 assert(hits/count>.97,`${building.name}: ${hits}/${count} roof samples`);coverage.push({name:building.name,count,hits});
}
assert.equal(JSON.stringify(data.buildings),original);
const world=fs.readFileSync('src/world.js','utf8');assert(world.includes('EAST_HISTORIC_IDS.includes(b.osmId)'));
console.log(JSON.stringify({passed:true,coverage,pickingPreserved:true,dataUnchanged:true,accuracy:'Form and roof slope approximate; not measured'}));asset.dispose();
