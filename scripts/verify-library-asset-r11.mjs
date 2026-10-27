import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import * as THREE from 'three';
import {CampusWorld} from '../src/world.js';
import {createLibraryAsset} from '../src/library-asset.js';
import {libraryAssetPlan,signedArea} from '../src/library-asset-plan.js';
import {integrateLibraryWorld} from './library-r11-integration.mjs';
import {BASE,pointIn,pointSegment,rng,bounds,extrude,boxGeometry} from '../src/geo.js';
import {mainTowerMassing} from '../src/main-tower-facade.js';
import {libraryMassingPlan} from '../src/library-massing.js';

const data=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url))),lib=data.buildings.find(b=>b.osmId===263624481),original=JSON.stringify(lib);
const plan=libraryAssetPlan(lib),baseZones=plan.zones.filter(z=>z.bottom===0),[x0,z0,x1,z1]=bounds(lib.points);
assert.deepEqual(plan.zones.slice(0,2).map(z=>z.rows),[4,5]);
assert.equal(plan.levels.south,11);assert(plan.heightScope.includes('only to the southern'));
assert.equal(baseZones.length,5,'North, stack and three independent southern sections required');
assert(baseZones.filter(z=>z.id.startsWith('south')).every(z=>z.rows===3&&z.top===13));
const totalArea=baseZones.reduce((n,z)=>n+z.cells.reduce((sum,p)=>sum+Math.abs(signedArea(p)),0),0);
assert(Math.abs(totalArea-Math.abs(signedArea(lib.points)))<.01,'Base partition loses or overlaps footprint area');
let spatialSamples=0;
for(let x=x0+.37;x<x1;x+=2.7)for(let z=z0+.23;z<z1;z+=2.7){
 const p=[x,z];if(lib.points.slice(1).some((q,i)=>pointSegment(p,lib.points[i],q).distance<.002))continue;
 const expected=pointIn(p,lib.points)?1:0,actual=baseZones.filter(v=>pointIn(p,v.points)).length;
 assert.equal(actual,expected,'Overlapping or missing ground partition at '+p);spatialSamples++;
}
for(let i=0;i<plan.courses.length;i++){
 const c=plan.courses[i];assert.equal(c.bottom,i?plan.courses[i-1].top:13,'Floating or interpenetrating course');
 for(const cell of c.cells)for(const p of cell){
  assert(pointIn(p,lib.points)||lib.points.slice(1).some((q,j)=>pointSegment(p,lib.points[j],q).distance<.002),'Course expands OSM footprint');
  if(i){const r=plan.courses[i-1].rect;assert(p[0]>=r[0]-.002&&p[0]<=r[2]+.002&&p[1]>=r[1]-.002&&p[1]<=r[3]+.002,'Unsupported overhang');}
 }
}
const gray=createLibraryAsset({building:lib,baseY:BASE,buildingIndex:0,stage:'massing'}),asset=createLibraryAsset({building:lib,baseY:BASE,buildingIndex:0});
assert.deepEqual(asset.userData.entrances.map(e=>e.side).sort(),['north','south'],'Duplicated entrance ownership/signage');
for(const model of [gray,asset]){
 const bb=new THREE.Box3().setFromObject(model);assert(bb.min.y>=BASE-.001&&bb.max.y<=BASE+49.75+.001);
 model.traverse(m=>{if(!m.isMesh)return;assert.equal(m.userData.place,lib);assert.equal(m.userData.buildingIndex,0);assert.equal(m.userData.libraryOwner,'library-asset.js');assert([...m.geometry.attributes.position.array].every(Number.isFinite));});
}
asset.updateMatrixWorld(true);
const ray=new THREE.Raycaster();let roofSamples=0;
for(let x=x0+2.17;x<x1;x+=6.1)for(let z=z0+1.73;z<z1;z+=6.1){
 if(!pointIn([x,z],lib.points))continue;
 ray.set(new THREE.Vector3(x,BASE+80,z),new THREE.Vector3(0,-1,0));
 assert(ray.intersectObject(asset,true).length,'Missing roof cap at '+[x,z]);roofSamples++;
}
assert.equal(JSON.stringify(lib),original,'Source building data mutated');
assert.throws(()=>libraryAssetPlan({...lib,points:lib.points.map(p=>[p[0]+4,p[1]])}),/review|required|changed/);

// Execute the real old and proposed buildBuildings methods. This catches RNG
// shifts, index changes and accidental geometry differences in OTHER buildings.
const diskSource=fs.readFileSync(new URL('../src/world.js',import.meta.url),'utf8').replaceAll('\r\n','\n');
const source=execFileSync('git',['show','3617013:src/world.js'],{encoding:'utf8'}).replaceAll('\r\n','\n'),patched=integrateLibraryWorld(source);
const palette=Function(source.match(/const PALETTE=.*?;/)[0]+'return PALETTE;')();
const compile=text=>{const method=text.slice(text.indexOf(' buildBuildings(){')+1,text.indexOf('\n addClock('));return Function('THREE','PALETTE','BASE','rng','bounds','extrude','boxGeometry','mainTowerMassing','pointIn','libraryMassingPlan','return function '+method)(THREE,palette,BASE,rng,bounds,extrude,boxGeometry,mainTowerMassing,pointIn,libraryMassingPlan);};
const proposed=compile(patched);
function renderBodies(fn){const w=Object.create(CampusWorld.prototype);w.data=structuredClone(data);w.footprintBounds=w.data.buildings.map(b=>bounds(b.points));w.scene=new THREE.Scene();w.dimensions=new Map();w.pickables=[];w.night={value:0};w.selection={value:-1};w.hover={value:-1};w.colorMode={value:0};w.clockCalls=0;w.addClock=()=>w.clockCalls++;fn.call(w);return w;}
const before=renderBodies(compile(source)),after=renderBodies(proposed),index=data.buildings.indexOf(lib);
function hashOther(mesh){const g=mesh.geometry,hash=crypto.createHash('sha256');let vertices=0,libraryVertices=0;const keys=Object.keys(g.attributes).sort();
 for(let i=0;i<g.attributes.position.count;i++){
  if(Math.round(g.attributes.buildingIndex.getX(i))===index){libraryVertices++;continue;}vertices++;
  for(const key of keys){const a=g.attributes[key];hash.update(Buffer.from(a.array.buffer,a.array.byteOffset+i*a.itemSize*4,a.itemSize*4));}
 }
 return {sha256:hash.digest('hex'),vertices,libraryVertices};}
const oldHash=hashOther(before.buildingMesh),newHash=hashOther(after.buildingMesh);
assert.equal(oldHash.sha256,newHash.sha256,'Unrelated campus building geometry/colours/IDs changed');
assert.equal(oldHash.vertices,newHash.vertices);assert(oldHash.libraryVertices>0);assert.equal(newHash.libraryVertices,0);
assert.equal(before.clockCalls,1);assert.equal(after.clockCalls,0,'Legacy generic clock still emitted');
assert.equal(before.blocked([-29,-210]),after.blocked([-29,-210]));
assert.deepEqual([...before.dimensions],[...after.dimensions]);
const sharedWorldUnchanged=diskSource===execFileSync('git',['show','HEAD:src/world.js'],{encoding:'utf8'}).replaceAll('\r\n','\n');
assert(sharedWorldUnchanged||diskSource.includes('this.libraryAsset=createLibraryAsset('),'Shared world.js changed without the declared integration');
const disposable=createLibraryAsset({building:lib,stage:'massing'}),parent=new THREE.Group();parent.add(disposable);let disposals=0;
disposable.traverse(m=>{if(m.isMesh)m.geometry.addEventListener('dispose',()=>disposals++);});disposable.dispose();const once=disposals;disposable.dispose();assert.equal(disposals,once);assert.equal(disposable.parent,null);assert(once>0,'Owned asset resources not released');
const output={passed:true,researchCommit:'506052b',baseArea:totalArea,spatialSamples,roofSamples,sourceDataUnchanged:true,sharedWorldUnchanged,
 otherBuildingGeometryAndColourUnchanged:true,otherBuildingHash:newHash.sha256,legacyLibraryVertices:oldHash.libraryVertices,newGenericLibraryVertices:0,
 gray:gray.userData.measurements,material:asset.userData.measurements,heightScope:plan.heightScope,terrainAndBridgeInferred:false};
fs.mkdirSync(new URL('../docs/quality-v2/library-r11/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../docs/quality-v2/library-r11/geometry-verification.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output));
