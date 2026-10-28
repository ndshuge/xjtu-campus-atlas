import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createTengfeiTower,createSiyuanStele} from '../src/axis-monuments.js';
import {createSiyuanCenter,createScienceHall} from '../src/cultural-facades.js';
import {createMainComplexAsset} from '../src/main-complex-asset.js';
import {createScienceHallAsset} from '../src/science-hall-asset.js';
import {bounds} from '../src/geo.js';
const d=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const world=fs.readFileSync(new URL('../src/world.js',import.meta.url),'utf8');
for(const symbol of ['createTengfeiTower',world.includes('createSiyuanCenterAsset(')?'createSiyuanCenterAsset':'createSiyuanCenter',world.includes('createScienceHallAsset(')?'createScienceHallAsset':'createScienceHall',world.includes('createMainComplexAsset(')?'createMainComplexAsset':'createMainTowerFacade','createFourInventionsMarker']){
 assert(world.includes(symbol+'('),'Not integrated into world scene: '+symbol);
}
assert(world.includes('createLibraryAsset(')||world.includes('createLibraryFacade('),'No library visual owner connected');
if(world.includes('createLibraryAsset('))assert(!world.includes('this.libraryFacade=createLibraryFacade('),'Old and new library visuals overlap');
const tower=d.landmarks.find(x=>x.name==='腾飞塔');
const student=d.buildings.find(x=>x.osmId===263624056);
const science=d.buildings.find(x=>x.osmId===263632364);
assert(tower&&student&&science,'Missing ground truth for integrated places');
const models=[
 createTengfeiTower(tower.position),
 createSiyuanCenter({footprint:bounds(student.points),height:student.height,baseY:1.1}),
 createScienceHall({footprint:bounds(science.points),height:science.height,baseY:1.1}),
 createSiyuanStele([0,0])
];
if(world.includes('createMainComplexAsset(')){
 assert(!world.includes('this.mainTowerFacade='),'Duplicate legacy Main E facade');
 const owned=createMainComplexAsset({buildings:d.buildings});assert.equal(owned.userData.owner,'main-complex-asset.js');models.push(owned);
}
if(world.includes('createSiyuanCenterAsset('))assert(!world.includes('this.siyuanCenterFacade='),'Duplicate legacy Siyuan facade');
if(world.includes('createScienceHallAsset(')){
 assert(!world.includes('this.scienceHallFacade='),'Duplicate legacy science facade');
 const owned=createScienceHallAsset({building:science,buildingIndex:d.buildings.indexOf(science)});assert.equal(owned.userData.owner,'science-hall-asset.js');models.push(owned);
}
for(const m of models){
 assert(m.children.length>0,m.name+' no geometry');
 const bb=new THREE.Box3().setFromObject(m);
 assert([...bb.min.toArray(),...bb.max.toArray()].every(Number.isFinite),'Non-finite model bounds: '+m.name);
 assert(m.children.every(c=>!c.isMesh||c.geometry?.attributes.position?.count>0),'Empty mesh in '+m.name);
}
assert(!world.includes('new THREE.TorusGeometry(3.6,.65'),'Legacy fake gold torus tower still active');
console.log(JSON.stringify({passed:true,integratedModels:models.length,modelNames:models.map(m=>m.name)}));
