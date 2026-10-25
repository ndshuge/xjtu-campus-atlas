import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {PLAZA_PAVING,buildFourInventionsPaving} from '../src/plaza-terrain.js';
import {pointIn} from '../src/geo.js';

const d=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const s=fs.readFileSync(new URL('../src/world.js',import.meta.url),'utf8');
const gate=fs.readFileSync(new URL('../src/north-gate.js',import.meta.url),'utf8');
assert(s.includes('ONE:THREE.TOUCH.PAN')&&s.includes('TWO:THREE.TOUCH.DOLLY_ROTATE'),'Phone must pan with one finger and orbit/zoom with two');
assert(s.includes('pointer: coarse')&&s.includes('navigator.maxTouchPoints'),'Touch mode must survive landscape orientation');
assert(s.includes('capture:true'),'User touch must cancel flight before OrbitControls pointerdown');
assert(s.includes('constrainOrbitToCampus()'),'Orbit target must stay bounded');
assert(s.includes('northGate.visible=gateDistance<'),'Overview should avoid distant gate billboard');
assert(gate.includes('map:calligraphy,side:THREE.FrontSide'),'Gate photographic inscription must not show mirrored reverse');
const scene=new THREE.Scene();
const group=buildFourInventionsPaving(scene);
assert(scene.children.includes(group));
assert.equal(group.children.filter(o=>o.name==='Perimeter lawn / interpretive planting pocket').length,4);
assert(group.children.some(o=>o.name==='North-south accessible walkway'));
assert(group.children.some(o=>o.name==='Open courtyard crossing'));
for(let x=PLAZA_PAVING.left+2;x<PLAZA_PAVING.right-2;x+=3)
 for(let z=PLAZA_PAVING.south+2;z<PLAZA_PAVING.north-2;z+=3)
  assert(!d.buildings.some(b=>pointIn([x,z],b.points)&&!b.holes?.some(h=>pointIn([x,z],h))),`Paved over mapped building at ${x},${z}`);
const bb=new THREE.Box3().setFromObject(group);
assert(bb.min.y>1.1&&bb.max.y<1.25,'No invented plaza terrain slope');
console.log(JSON.stringify({passed:true,pavingBounds:PLAZA_PAVING,landscapePatches:4,oneFingerPan:true,twoFingerCamera:true,gateBackfaceFixed:true}));
