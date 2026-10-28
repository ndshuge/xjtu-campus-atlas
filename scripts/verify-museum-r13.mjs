import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createRelocationMuseumAsset,RELOCATION_MUSEUM_ID} from '../src/relocation-museum-asset.js';
import {CampusWorld} from '../src/world.js';
import {BASE,bounds,pointIn} from '../src/geo.js';

const data=JSON.parse(fs.readFileSync('public/data/campus.json'));
const building=data.buildings.find(b=>b.osmId===RELOCATION_MUSEUM_ID),index=data.buildings.indexOf(building);
assert(building&&index>=0);const original=JSON.stringify(building),bb=bounds(building.points);
const asset=createRelocationMuseumAsset({building,buildingIndex:index});
const gray=createRelocationMuseumAsset({building,buildingIndex:index,stage:'massing'});
for(const root of [asset,gray])root.traverse(mesh=>{
 if(!mesh.isMesh)return;
 assert.equal(mesh.userData.owner,'relocation-museum-asset.js');assert(mesh.userData.buildingAssetMesh);
 for(const value of mesh.geometry.attributes.position.array)assert(Number.isFinite(value));
 for(const id of mesh.geometry.attributes.buildingIndex.array)assert.equal(id,index);
});
const box=new THREE.Box3().setFromObject(asset);
assert(box.min.y>=BASE-.001&&box.max.y<=BASE+building.height+.001);
assert(box.min.x>=bb[0]-.3&&box.max.x<=bb[2]+.3&&box.min.z>=bb[1]-.3&&box.max.z<=bb[3]+.3);
asset.updateMatrixWorld(true);const ray=new THREE.Raycaster();let roofSamples=0,low=0,high=0;
for(let x=bb[0]+1;x<bb[2]-1;x+=3)for(let z=bb[1]+1;z<bb[3]-1;z+=3){
 if(!pointIn([x,z],building.points))continue;
 ray.set(new THREE.Vector3(x,BASE+building.height+8,z),new THREE.Vector3(0,-1,0));
 const hit=ray.intersectObject(asset,true)[0];assert(hit,'Missing roof at '+[x,z]);
 if(hit.point.y<BASE+building.height*.8)low++;else high++;roofSamples++;
}
assert(low>20&&high>20,'Both visible volumes must retain roof coverage');
const seamZ=building.points[0][1]+(building.points[3][1]-building.points[0][1])*.58;
const centerX=(bb[0]+bb[2])/2;ray.set(new THREE.Vector3(centerX,BASE+building.height*.8,seamZ+2),new THREE.Vector3(0,0,-1));
assert(ray.intersectObject(asset,true).length,'Upper part of the stepped volume must have a closed side');
ray.set(new THREE.Vector3(bb[0]-10,BASE+building.height*.7,(bb[1]+bb[3])/2-10),new THREE.Vector3(1,0,0));
const front=ray.intersectObject(asset,true)[0];assert(front,'West facade must remain pickable');
const fake=Object.create(CampusWorld.prototype);fake.data=data;fake.buildingMesh=null;
assert.equal(fake.hitPlace(front).place.id,building.id);
assert.equal(JSON.stringify(building),original,'OSM source data must remain unchanged');
const world=fs.readFileSync('src/world.js','utf8');assert(world.includes('this.museumAsset=createRelocationMuseumAsset('));
const triangles=asset.children.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0);
console.log(JSON.stringify({passed:true,roofSamples,lowRoofSamples:low,highRoofSamples:high,steppedSideClosed:true,sourceDataUnchanged:true,pickingPreserved:true,triangles,accuracy:'Photo-guided exterior, split and elevations approximate'}));
asset.dispose();gray.dispose();
