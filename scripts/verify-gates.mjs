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
 assert(Math.abs(b.min.y-1.1)<.03,'Schematic entrance locator floats above the ground datum');
 assert(mesh.children.some(c=>c.material?.transparent&&c.material.opacity>=.8),'Schematic gate posts too faint to read as ground-supported');
 assert.equal(mesh.children.length,6,'Unverified side gates must use only neutral location markers');
 assert(!mesh.children.some(c=>/canopy|limestone|decorative/i.test(c.name)),'Invented side-gate facade');
 tested++;
}
const origCanvas=globalThis.document;
const origLoader=THREE.TextureLoader.prototype.load;
THREE.TextureLoader.prototype.load=()=>new THREE.Texture();
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({clearRect(){},fillText(){},fillStyle:null,font:null,textAlign:null,textBaseline:null})})};
try{
 const north=createNorthGate(main.position,1.1);
 assert(north.children.some(c=>c.name==='sweeping white gate roof'));
 assert(north.children.some(c=>c.name==='bronze science relief panel'));
 const reliefPanels=north.children.filter(c=>c.name==='bronze science relief panel');
 assert.equal(reliefPanels.length,2,'Both documented North Gate reliefs must exist');
 const postOffice=data.buildings.find(b=>b.osmId===264738602);
 const eastRelief=reliefPanels.find(p=>p.position.x>main.position[0]);
 assert(postOffice&&eastRelief.position.z<Math.min(...postOffice.points.map(p=>p[1]))-.3,
  'Photographed east-side relief is hidden behind the existing OSM post office frontage');
 assert(north.children.some(c=>c.name==='abstract science orbit'),'Northern natural-science relief interpretation missing');
 assert(north.children.some(c=>c.name==='abstract engineering gear'),'Northern engineering relief interpretation missing');
 assert(north.children.some(c=>c.name==='2011 photographed north gate inscription'));
 const chinese=north.children.find(c=>c.name==='2011 photographed north gate inscription');
 const english=north.children.find(c=>c.name==='front facade inscription');
 // North exterior is viewed along +Z, thus increasing model X projects screen-left.
 assert(chinese.position.x>english.position.x,'Chinese must appear left of English in exterior photo view');
 assert(chinese.material.transparent&&chinese.material.alphaTest>0,'Photo cutout must not paste a solid white background on the tiled arch');
 assert(chinese.geometry.parameters.width<22,'Photographic glyphs must not stretch across a 26m billboard');
 assert.equal(chinese.material.map.repeat.x,1,'Mirror regression: exterior photograph text must remain correctly ordered');
 const mask=fs.readFileSync(new URL('../public/assets/reference/north-gate-ink-mask-r8.png',import.meta.url));
 assert(mask.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'CC-licensed cutout must be PNG');
 assert.equal(mask.readUInt32BE(16),388,'Unexpected calligraphy source crop width');
 assert.equal(mask.readUInt32BE(20),96,'Unexpected calligraphy source crop height');
 assert.equal(mask[25],6,'Gate cutout must have RGBA channels and preserve transparency');
 assert(north.userData.accuracy.includes('not surveyed'),'Gate cannot claim 2026 as-built accuracy');
 const canopy=north.children.find(c=>c.name==='sweeping white gate roof');
 assert(canopy.geometry.attributes.uv?.count===canopy.geometry.attributes.position.count,'Curved tile roof UVs must be finite and complete');
 const heights=canopy.geometry.attributes.position;
 assert(heights.getY(0)>heights.getY(72),'Roof ends must rise above central sweep');
 assert([...canopy.geometry.attributes.position.array].every(Number.isFinite),'Gate fascia contains bad vertices');
 const box=new THREE.Box3().setFromObject(north);
 assert(box.min.x<main.position[0]-25&&box.max.x>main.position[0]+25);
 assert(box.max.y<15);
 assert(Math.abs(box.min.y-1.1)<.05,'North Gate has no ground-contact geometry');
 const southEntry=gates.find(g=>g.name==='南门');
 assert.equal(southEntry.passagePositions.length,2,'South Gate must retain both mapped passage anchors');
 const southGate=createSouthGate(southEntry.position,1.1,southEntry.passagePositions);
 const southBox=new THREE.Box3().setFromObject(southGate);
 assert(southGate.children.some(c=>c.name==='red granite sign wall'));
 assert(southGate.children.some(c=>c.name==='2011 photographed south gate signage'));
 assert(!southGate.children.some(c=>c.name==='roof lantern'),'Unsurveyed building should not block southern approach');
 assert(southBox.max.y<12&&southBox.min.y>0);
 assert(Math.abs(southBox.min.y-1.1)<.05,'South Gate name wall floats above the ground datum');
 // The two independent mapped South Gate vehicle/pedestrian lanes must not be
 // covered by the modelled 2011 name wall. Lane width here is a test envelope,
 // not a certified clearance or as-built road dimension.
 const sign=southGate.children.find(c=>c.name==='red granite sign wall');
 assert(Math.abs(sign.position.x-southEntry.position[0])<.1,
  'South Gate sign must align to the mapped passage midpoint, not a guessed 31m west shift');
 const activityCenter=data.buildings.find(b=>b.osmId===263624056)?.center;
 assert(activityCenter&&Math.abs(sign.position.x-activityCenter[0])<10,
  'South Gate monument should visually align with Siyuan Student Activity Center');
 // The complete monument (plinth + cap, not just sign wall) must leave the mapped
 // passage anchors and an approximate 2.25m conservative lateral envelope clear.
 for(const node of south)assert(node.position[0]>southBox.max.x+2.25||node.position[0]<southBox.min.x-2.25,
  'South Gate monument intersects a mapped passage corridor');
 assert(!southGate.children.some(c=>c.name==='side guard rail'),'Invented road-blocking rail reintroduced');
 console.log(JSON.stringify({passed:true,otherGateCount:tested,hasNorth:true,northBounds:[box.min.toArray(),box.max.toArray()]}));
} finally {globalThis.document=origCanvas;THREE.TextureLoader.prototype.load=origLoader;}
