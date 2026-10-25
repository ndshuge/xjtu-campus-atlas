import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createSecondaryGate} from '../src/secondary-gates.js';
import {createNorthGate} from '../src/north-gate.js';
import {createSouthGate} from '../src/south-gate.js';
import {getCampusGateEntries,visualGatePosition} from '../src/gate-entries.js';
const data=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const gates=getCampusGateEntries(data);
const names=gates.map(g=>g.name).sort();
assert.deepEqual(names,['东北门','东南门','南门','西北门','西南门'].sort());
const south=data.pois.filter(p=>p.name==='南门'&&p.tags?.barrier==='gate');
assert.equal(south.length,2);
const main=data.landmarks.find(p=>p.name==='北门');
assert(main&&main.position.every(Number.isFinite));
let tested=0;
for(const p of gates){
 assert(p.position.every(Number.isFinite));
 const pos=visualGatePosition(p);
 assert(Math.hypot(pos[0]-p.position[0],pos[1]-p.position[1])<=11);
 const mesh=createSecondaryGate({position:pos,name:p.name,baseY:1.1});
 const b=new THREE.Box3().setFromObject(mesh);
 assert(Number.isFinite(b.min.x)&&Number.isFinite(b.max.z));
 assert(b.max.y<=7&&b.min.y>=1);
 assert(mesh.children.length>=6);
 tested++;
}
const origCanvas=globalThis.document;
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({clearRect(){},fillText(){},fillStyle:null,font:null,textAlign:null,textBaseline:null})})};
try{
 const north=createNorthGate(main.position,1.1);
 assert(north.children.some(c=>c.name==='sweeping white gate roof'));
 assert(north.children.some(c=>c.name==='bronze science relief panel'));
 const box=new THREE.Box3().setFromObject(north);
 assert(box.min.x<main.position[0]-25&&box.max.x>main.position[0]+25);
 assert(box.max.y<15);
 const southGate=createSouthGate(gates.find(g=>g.name==='南门').position,1.1);
 const southBox=new THREE.Box3().setFromObject(southGate);
 assert(southGate.children.some(c=>c.name==='red granite sign wall'));
 assert(southGate.children.some(c=>c.name==='roof lantern'));
 assert(southBox.max.y<20&&southBox.min.y>0);
 console.log(JSON.stringify({passed:true,otherGateCount:tested,hasNorth:true,northBounds:[box.min.toArray(),box.max.toArray()]}));
} finally {globalThis.document=origCanvas;}
