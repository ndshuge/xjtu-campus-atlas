import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSiyuanCenterAsset,SIYUAN_ID} from '../src/siyuan-center-asset.js';
import {CampusWorld} from '../src/world.js';
import {BASE,bounds,pointIn} from '../src/geo.js';
import {planCells,cellBoundary} from '../src/library-asset-plan.js';

const data=JSON.parse(fs.readFileSync('public/data/campus.json'));
const building=data.buildings.find(b=>b.osmId===SIYUAN_ID),index=data.buildings.indexOf(building);
assert(building&&index>=0);const original=JSON.stringify(building),bb=bounds(building.points);
const asset=createSiyuanCenterAsset({building,buildingIndex:index});
const gray=createSiyuanCenterAsset({building,buildingIndex:index,stage:'massing'});
for(const root of [asset,gray])root.traverse(mesh=>{
 if(!mesh.isMesh)return;
 assert.equal(mesh.userData.owner,'siyuan-center-asset.js');
 assert(mesh.userData.buildingAssetMesh);
 for(const value of mesh.geometry.attributes.position.array)assert(Number.isFinite(value));
 for(const id of mesh.geometry.attributes.buildingIndex.array)assert.equal(id,index);
});
const box=new THREE.Box3().setFromObject(asset);
assert(box.min.y>=BASE-.001&&box.max.y<=BASE+building.height+.001);
assert(box.min.x>=bb[0]-2&&box.max.x<=bb[2]+2);
assert(box.min.z>=bb[1]-.1&&box.max.z<=bb[3]+3.1);
asset.updateMatrixWorld(true);const ray=new THREE.Raycaster();let roofSamples=0;
for(let x=bb[0]+1;x<bb[2]-1;x+=6)for(let z=bb[1]+1;z<bb[3]-1;z+=6){
 if(!pointIn([x,z],building.points))continue;
 ray.set(new THREE.Vector3(x,BASE+building.height+10,z),new THREE.Vector3(0,-1,0));
 assert(ray.intersectObject(asset,true)[0],'Missing roof coverage at '+[x,z]);roofSamples++;
}
ray.set(new THREE.Vector3((bb[0]+bb[2])/2,BASE+10,bb[3]+10),new THREE.Vector3(0,0,-1));
const front=ray.intersectObject(asset,true)[0];assert(front,'South front must remain pickable');
const fake=Object.create(CampusWorld.prototype);fake.data=data;fake.buildingMesh=null;
assert.equal(fake.hitPlace(front).place.id,building.id);
fake.footprintBounds=data.buildings.map(b=>bounds(b.points));
const e=cellBoundary(planCells(building.points)).find(edge=>edge.nz>.9);assert(e);
for(const fraction of [.245,.755]){
 const x=e.a[0]+e.ux*e.length*fraction,z=e.a[1]+e.uz*e.length*fraction;
 ray.set(new THREE.Vector3(x+e.nx*3,BASE+2,z+e.nz*3),new THREE.Vector3(-e.nx,0,-e.nz));
 const column=ray.intersectObject(asset,true)[0];assert(column,'Entrance column missing');
 assert(fake.blocked([column.point.x+e.nx*.02,column.point.z+e.nz*.02],.65),'Walk camera can intersect an entrance column');
}
assert.equal(JSON.stringify(building),original,'OSM data must remain unchanged');
const world=fs.readFileSync('src/world.js','utf8');
assert(world.includes('this.siyuanAsset=createSiyuanCenterAsset('));
assert(!world.includes('this.siyuanCenterFacade='));
const triangles=asset.children.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0);
console.log(JSON.stringify({passed:true,roofSamples,sourceDataUnchanged:true,pickingPreserved:true,entranceCollision:true,triangles,meshes:asset.children.length,accuracy:'Photo-guided front; unmeasured dimensions and rear remain approximate'}));
asset.dispose();gray.dispose();
