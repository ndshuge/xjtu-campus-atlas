import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createFourInventionsMarker} from '../src/four-inventions.js';
import {pointIn} from '../src/geo.js';

const data=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const square=data.interpretive.find(p=>p.id==='interpretive/four-inventions');
assert(square,'Four Inventions Square is missing from campus data');
const artwork=createFourInventionsMarker(square.position);
assert.equal(artwork.userData.arrangement,'four corners, not a central monument');
assert.equal(artwork.userData.exactPlacementsUnverified,true);
assert.equal(artwork.userData.individualSculptureShapesUnverified,true);
const names=['Papermaking','Printing','Compass','Gunpowder'];
for(const name of names){
 const foundation=artwork.children.find(c=>c.name===name+' / granite foundation');
 assert(foundation,'Missing independent '+name+' foundation');
 const x=foundation.position.x,z=foundation.position.z;
 assert(Number.isFinite(x)&&Number.isFinite(z),'Non-finite foundation');
 assert(Math.hypot(x-square.position[0],z-square.position[1])>8,'No artwork may be in the open central square');
 assert(data.boundary.some(poly=>pointIn([x,z],poly)),name+' foundation outside campus');
 assert(!data.buildings.some(b=>pointIn([x,z],b.points)),name+' overlaps a surveyed building footprint');
 const objects=artwork.children.filter(c=>c.name.startsWith(name+' /'));
 assert(objects.length>=3,name+' has insufficient independent geometry');
}
assert.equal(artwork.children.filter(c=>c.name.startsWith('Papermaking / one of twenty interpretive leaves')).length,20,'Official article describes 20 paper leaves');
assert(artwork.children.some(c=>c.name==='Printing / photo-based carved stone block 8'),'Photo-informed printing block relief missing');
const bbox=new THREE.Box3().setFromObject(artwork);
assert(bbox.max.y<10&&bbox.min.y>0.9,'Unreasonable sculptural height');
console.log(JSON.stringify({passed:true,installationCount:4,geometryCount:artwork.children.length,centerOpen:true}));
