import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createCentralBuildingsAsset,CENTRAL_IDS} from '../src/central-buildings-asset.js';
import {CampusWorld} from '../src/world.js';
import {BASE,bounds,pointIn} from '../src/geo.js';

const data=JSON.parse(fs.readFileSync('public/data/campus.json'));
const buildings=data.buildings.filter(b=>CENTRAL_IDS.includes(b.osmId)),original=JSON.stringify(buildings);
assert.equal(buildings.length,3);
const asset=createCentralBuildingsAsset({buildings:data.buildings}),gray=createCentralBuildingsAsset({buildings:data.buildings,stage:'massing'});
const detail=asset.children.find(m=>m.name.endsWith(' / dark'));assert(detail&&!detail.castShadow);
const centralCenter=data.buildings.find(b=>b.osmId===263625088).center;
const camera={position:new THREE.Vector3(centralCenter[0],BASE+7,centralCenter[1]+1000)};
asset.updateDetailLOD(camera);assert.equal(detail.visible,false,'Distant window jambs should not render');
camera.position.z=centralCenter[1]+800;asset.updateDetailLOD(camera);assert.equal(detail.visible,false,'LOD hysteresis should avoid flicker');
camera.position.z=centralCenter[1]+400;asset.updateDetailLOD(camera);assert.equal(detail.visible,true,'Near window jambs must return');
const seen=new Set();
for(const root of [asset,gray])root.traverse(mesh=>{
 if(!mesh.isMesh)return;
 assert.equal(mesh.userData.owner,'central-buildings-asset.js');assert(mesh.userData.buildingAssetMesh);
 for(const value of mesh.geometry.attributes.position.array)assert(Number.isFinite(value));
 for(const id of mesh.geometry.attributes.buildingIndex.array){assert(CENTRAL_IDS.includes(data.buildings[id]?.osmId));seen.add(data.buildings[id].osmId);}
});
assert.deepEqual([...seen].sort(),CENTRAL_IDS.slice().sort());
asset.updateMatrixWorld(true);const ray=new THREE.Raycaster(),coverage=[];
for(const building of buildings){
 const bb=bounds(building.points);let samples=0,hits=0;
 for(let x=bb[0]+1;x<bb[2]-1;x+=4)for(let z=bb[1]+1;z<bb[3]-1;z+=4){
  if(!pointIn([x,z],building.points))continue;samples++;
  ray.set(new THREE.Vector3(x,BASE+building.height+10,z),new THREE.Vector3(0,-1,0));
  const hit=ray.intersectObject(asset,true)[0];if(hit&&hit.point.y>=BASE+building.height-2.11)hits++;
 }
 assert(hits/samples>.96,`Roof coverage incomplete for ${building.name}: ${hits}/${samples}`);coverage.push({id:building.osmId,samples,hits});
}
const central=buildings.find(b=>b.osmId===263625088),bb=bounds(central.points);
ray.set(new THREE.Vector3((bb[0]+bb[2])/2,BASE+7,bb[1]-12),new THREE.Vector3(0,0,1));
const front=ray.intersectObject(asset,true)[0];assert(front,'North entry remains pickable');
const fake=Object.create(CampusWorld.prototype);fake.data=data;fake.buildingMesh=null;
assert.equal(fake.hitPlace(front).place.id,central.id);
fake.footprintBounds=data.buildings.map(b=>bounds(b.points));
const entranceX=(central.points[2][0]+central.points[3][0])/2,entranceZ=central.points[2][1];
for(const dx of [-5,-1.7,1.7,5]){
 ray.set(new THREE.Vector3(entranceX+dx,BASE+2,entranceZ-3),new THREE.Vector3(0,0,1));
 const column=ray.intersectObject(asset,true)[0];assert(column,'Entrance column missing');
 assert(fake.blocked([column.point.x,column.point.z-.02],.65),'Walk camera can intersect an entrance column');
}
assert.equal(JSON.stringify(buildings),original,'OSM source data must remain unchanged');
const world=fs.readFileSync('src/world.js','utf8');assert(world.includes('this.centralBuildingAsset=createCentralBuildingsAsset('));
assert(!world.includes('const central=this.data.buildings.find(b=>b.osmId===263625088)'),'Old generic roof cap must not remain');
const triangles=asset.children.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0);
console.log(JSON.stringify({passed:true,coverage,ids:seen.size,pickingPreserved:true,entranceCollision:true,sourceDataUnchanged:true,triangles,farJambLOD:true,nearDetailsRestored:true,accuracy:'Photo-guided group; roof slopes and storey heights approximate'}));
asset.dispose();gray.dispose();
