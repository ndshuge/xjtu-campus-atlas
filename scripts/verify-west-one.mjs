import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createWestOneAsset,WEST_ONE_ID,WEST_ONE_APPROX_HEIGHT} from '../src/west-one-asset.js';
import {CampusWorld} from '../src/world.js';

const data=JSON.parse(fs.readFileSync('public/data/campus.json','utf8'));
const index=data.buildings.findIndex(b=>b.osmId===WEST_ONE_ID),building=data.buildings[index];
assert(building,'Missing mapped West 1');
const before=JSON.stringify(building),asset=createWestOneAsset({building,buildingIndex:index});
assert.equal(JSON.stringify(building),before,'Source footprint changed');
const heights=new THREE.Box3().setFromObject(asset);
assert(heights.max.y<=1.1+WEST_ONE_APPROX_HEIGHT+.01&&heights.min.y>=1.09);
let triangles=0,seen=0;
asset.traverse(m=>{if(!m.isMesh)return;assert(m.userData.buildingAssetMesh);assert.equal(m.userData.owner,'west-one-asset.js');
 for(const value of m.geometry.attributes.position.array)assert(Number.isFinite(value));
 for(const id of m.geometry.attributes.buildingIndex.array){assert.equal(id,index);seen++;}
 triangles+=m.geometry.attributes.position.count/3;});
assert(seen>0&&triangles>0);
asset.updateMatrixWorld(true);
const box=new THREE.Box3().setFromObject(asset),ray=new THREE.Raycaster();let selected=false;
for(let x=box.min.x+2;x<box.max.x&&!selected;x+=3){
 ray.set(new THREE.Vector3(x,10,box.min.z-10),new THREE.Vector3(0,0,1));
 const hit=ray.intersectObject(asset,true)[0];if(hit)selected=CampusWorld.prototype.hitPlace.call({data},hit)?.place?.id===building.id;
}
assert(selected,'West 1 facade is not selectable as the original OSM building');
const world=fs.readFileSync('src/world.js','utf8');
assert(world.includes('this.westOneAsset=createWestOneAsset('));
assert(world.includes('b.osmId===263625085'));
asset.dispose();
console.log(JSON.stringify({passed:true,id:building.id,triangles,estimatedHeight:WEST_ONE_APPROX_HEIGHT,sourceUnchanged:true}));
