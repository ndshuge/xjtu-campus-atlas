import fs from 'node:fs';import assert from 'node:assert/strict';import * as THREE from 'three';
import {createScienceHallAsset,scienceHallPlan,SCIENCE_ID} from '../src/science-hall-asset.js';
import {CampusWorld} from '../src/world.js';import {BASE,bounds,pointIn} from '../src/geo.js';
const data=JSON.parse(fs.readFileSync('public/data/campus.json')),building=data.buildings.find(b=>b.osmId===SCIENCE_ID),index=data.buildings.indexOf(building),source=JSON.stringify(building),plan=scienceHallPlan(building);
assert.equal(plan.zones.length,3);assert(plan.area>plan.sourceArea&&plan.area-plan.sourceArea<20,'Visual fold exceeds reviewed small expansion');
const model=createScienceHallAsset({building,buildingIndex:index}),gray=createScienceHallAsset({building,buildingIndex:index,stage:'massing'}),bb=bounds(building.points);
for(const root of [model,gray])root.traverse(m=>{if(!m.isMesh)return;assert.equal(m.userData.owner,'science-hall-asset.js');assert(m.userData.buildingAssetMesh);assert(!m.material.transparent);for(const i of m.geometry.attributes.buildingIndex.array)assert.equal(i,index);for(const value of m.geometry.attributes.position.array)assert(Number.isFinite(value));});
assert.equal(model.userData.foldedCurtainEdges,2);assert(model.userData.roofFrameTriangles>=250&&model.userData.roofFrameTriangles<350);
const box=new THREE.Box3().setFromObject(model);assert(box.min.y>=BASE-.001&&box.max.y<BASE+25.3);assert(box.min.x>=bb[0]-.01&&box.max.x<=bb[2]+.01);
model.updateMatrixWorld(true);const ray=new THREE.Raycaster(),cast=(x,z)=>{ray.set(new THREE.Vector3(x,BASE+40,z),new THREE.Vector3(0,-1,0));return ray.intersectObject(model,true)[0];};
const main=cast(95,-20),annex=cast(72,-78),link=cast(67,-49);assert(main&&annex&&link);assert(Math.abs(main.point.y-BASE-21)<.02);assert(annex.point.y>BASE+8&&annex.point.y<BASE+12);assert(Math.abs(link.point.y-BASE-6.4)<.02);
let samples=0;for(let x=bb[0]+.37;x<bb[2];x+=4.1)for(let z=bb[1]+.71;z<bb[3];z+=4.1){if(!pointIn([x,z],building.points))continue;assert(cast(x,z),'Missing science roof '+[x,z]);samples++;}
const glassX=[];for(const z of [-20,-12.0355,-4]){ray.set(new THREE.Vector3(40,BASE+12,z),new THREE.Vector3(1,0,0));const hit=ray.intersectObject(model,true)[0];assert(hit&&/\/ (glass|frame)$/.test(hit.object.name));glassX.push(hit.point.x);}
assert(glassX[1]<Math.min(glassX[0],glassX[2])-.25,'West fold lost its depth');
const fake=Object.create(CampusWorld.prototype);fake.data=data;fake.buildingMesh=null;assert.equal(fake.hitPlace(main).place.id,building.id);
assert.equal(JSON.stringify(building),source);assert.throws(()=>scienceHallPlan({...building,points:building.points.map(p=>[p[0]+3,p[1]])}),/review|seams/i);
const world=fs.readFileSync('src/world.js','utf8');assert(world.includes('this.scienceAsset=createScienceHallAsset('));assert(!world.includes('this.scienceHallFacade='));assert(world.includes('includeScience:false'));
const triangles=model.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0);model.dispose();gray.dispose();
const result={passed:true,roofSamples:samples,sourceDataUnchanged:true,foldAreaExpansion:plan.area-plan.sourceArea,curtainFold:true,roofFrameReused:true,rayHeights:{main:main.point.y-BASE,annex:annex.point.y-BASE,link:link.point.y-BASE},triangles,meshes:model.children.length,pickingPreserved:true,accuracy:'Photo-guided approximate roof and annex elevations'};
fs.writeFileSync('docs/quality-v2/buildings-r12/science-geometry-verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
