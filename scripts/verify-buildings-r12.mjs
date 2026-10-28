import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';import * as THREE from 'three';
import {CampusWorld} from '../src/world.js';
import {createMainComplexAsset,MAIN_IDS,MAIN_HEIGHTS,mainDisplayHeight} from '../src/main-complex-asset.js';
import {BASE,rng,bounds,extrude,boxGeometry,pointIn} from '../src/geo.js';
import {mainTowerMassing} from '../src/main-tower-facade.js';
const data=JSON.parse(fs.readFileSync('public/data/campus.json')),snapshot=JSON.stringify(data);
const model=createMainComplexAsset({buildings:data.buildings,baseY:BASE}),gray=createMainComplexAsset({buildings:data.buildings,baseY:BASE,stage:'massing'});
const original=execFileSync('git',['show','165a0a3:src/world.js'],{encoding:'utf8'}).replaceAll('\r\n','\n'),current=fs.readFileSync('src/world.js','utf8').replaceAll('\r\n','\n');
const palette=Function(original.match(/const PALETTE=.*?;/)[0]+'return PALETTE;')();
const compile=text=>{const method=text.slice(text.indexOf(' buildBuildings(){')+1,text.indexOf('\n addClock('));return Function('THREE','PALETTE','BASE','rng','bounds','extrude','boxGeometry','mainTowerMassing','pointIn','MAIN_IDS','mainDisplayHeight','SCIENCE_ID','SIYUAN_ID','RELOCATION_MUSEUM_ID','CENTRAL_IDS','return function '+method)(THREE,palette,BASE,rng,bounds,extrude,boxGeometry,mainTowerMassing,pointIn,MAIN_IDS,mainDisplayHeight,263632364,263624056,1167525875,[263625087,263625088,263625089]);};
function run(source){const w=Object.create(CampusWorld.prototype);w.data=structuredClone(data);w.scene=new THREE.Scene();w.dimensions=new Map();w.pickables=[];w.selection={value:-1};w.hover={value:-1};w.night={value:0};w.colorMode={value:0};compile(source).call(w);return w;}
const before=run(original),after=run(current),indices=MAIN_IDS.map(id=>data.buildings.findIndex(b=>b.osmId===id));
const excludedIds=[...MAIN_IDS,...(current.includes('this.scienceAsset=')?[263632364]:[]),...(current.includes('this.siyuanAsset=')?[263624056]:[]),...(current.includes('this.museumAsset=')?[1167525875]:[]),...(current.includes('this.centralBuildingAsset=')?[263625087,263625088,263625089]:[])],genericIndices=excludedIds.map(id=>data.buildings.findIndex(b=>b.osmId===id));
function hashOthers(mesh){const hash=crypto.createHash('sha256'),g=mesh.geometry;let vertices=0,owned=0;const keys=Object.keys(g.attributes).sort();
 for(let i=0;i<g.attributes.position.count;i++){if(genericIndices.includes(g.attributes.buildingIndex.getX(i))){owned++;continue;}vertices++;for(const key of keys){const a=g.attributes[key];hash.update(Buffer.from(a.array.buffer,a.array.byteOffset+i*a.itemSize*4,a.itemSize*4));}}
 return {hash:hash.digest('hex'),vertices,owned};}
const old=hashOthers(before.buildingMesh),next=hashOthers(after.buildingMesh);assert.equal(old.hash,next.hash,'Unrelated building geometry/colour/IDs changed');assert.equal(old.vertices,next.vertices);assert(old.owned>0);assert.equal(next.owned,0,'Generic core-building mesh survived');
for(const g of [model,gray]){
 const box=new THREE.Box3().setFromObject(g);assert(box.min.y>=BASE-.001);assert(box.max.y<=BASE+MAIN_HEIGHTS.tower+.001);
 const seen=new Set();g.traverse(m=>{if(!m.isMesh)return;assert(m.userData.buildingAssetMesh);assert.equal(m.userData.owner,'main-complex-asset.js');assert(!m.material.transparent);for(const x of m.geometry.attributes.position.array)assert(Number.isFinite(x));
  for(const i of m.geometry.attributes.buildingIndex.array){assert(indices.includes(i));seen.add(i);}
 });assert.deepEqual([...seen].sort((a,b)=>a-b),indices.slice().sort((a,b)=>a-b));
}
model.updateMatrixWorld(true);const main=data.buildings.find(b=>b.osmId===263624057),bb=bounds(main.points),cx=(bb[0]+bb[2])/2,cz=(bb[1]+bb[3])/2,ray=new THREE.Raycaster();
for(const dx of [-11,11]){ray.set(new THREE.Vector3(cx+dx,BASE+88,bb[1]-5),new THREE.Vector3(0,0,1));assert.equal(ray.intersectObject(model,true).length,0,'Top portal daylight blocked');}
ray.set(new THREE.Vector3(bb[0]+3.6,BASE+88,bb[1]-5),new THREE.Vector3(0,0,1));assert(ray.intersectObject(model,true).length>0,'Roof corner support missing');
ray.set(new THREE.Vector3(bb[2]+5,BASE+88,cz),new THREE.Vector3(-1,0,0));assert.equal(ray.intersectObject(model,true).length,0,'Side portal daylight blocked');
ray.set(new THREE.Vector3(cx,BASE+30,bb[1]-5),new THREE.Vector3(0,0,1));const hit=ray.intersectObject(model,true)[0];assert(hit,'Tower facade missing');assert.equal(after.hitPlace(hit).place.id,main.id,'Merged asset picking loses building ID');
const allBounds=bounds(MAIN_IDS.flatMap(id=>data.buildings.find(b=>b.osmId===id).points));let samples=0;
for(let x=allBounds[0]+1.3;x<allBounds[2];x+=7.1)for(let z=allBounds[1]+.7;z<allBounds[3];z+=7.1){if(!MAIN_IDS.some(id=>pointIn([x,z],data.buildings.find(b=>b.osmId===id).points)))continue;ray.set(new THREE.Vector3(x,BASE+130,z),new THREE.Vector3(0,-1,0));assert(ray.intersectObject(model,true).length,'Missing visible roof '+[x,z]);samples++;}
assert(after.dimensions.get(main.id).height===100);assert.equal(JSON.stringify(data),snapshot,'Source data mutated');assert(current.includes('includeMain:false'));assert(!current.includes('this.mainTowerFacade='),'Legacy tower overlay retained');
const stats=g=>{let triangles=0;g.traverse(m=>{if(m.isMesh)triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;});return {triangles,meshes:g.children.length};};
let disposed=0;model.traverse(m=>{if(m.isMesh)m.geometry.addEventListener('dispose',()=>disposed++);});model.dispose();const once=disposed;model.dispose();assert.equal(disposed,once);gray.dispose();
const report={passed:true,baseCommit:'165a0a3',excludedIds,dataUnchanged:true,nonCoreGeometryAndColoursUnchanged:true,nonCoreHash:next.hash,genericVerticesBefore:old.owned,genericVerticesAfter:next.owned,roofSamples:samples,material:stats(model),gray:stats(gray),portalFrontAndSideClear:true,pickingPreserved:true,heightPolicy:'photo estimates, not surveyed'};
fs.mkdirSync('docs/quality-v2/buildings-r12',{recursive:true});fs.writeFileSync('docs/quality-v2/buildings-r12/geometry-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
