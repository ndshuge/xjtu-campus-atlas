import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createLibraryForecourt} from '../src/library-forecourt.js';
import {createLibraryClock} from '../src/library-clock.js';
import {bounds,pointIn,pointSegment} from '../src/geo.js';

const source=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const library=source.buildings.find(b=>b.osmId===263624481);
assert(library,'Missing XJTU Library OSM footprint');
const [left,back,right,front]=bounds(library.points);
const x=(left+right)/2;
const clock=createLibraryClock({centerX:x,steppedCenterZ:front-21});
const courtyard=createLibraryForecourt({centerX:x,facadeFrontZ:front});
const towerBox=new THREE.Box3().setFromObject(clock);
const courtyardBox=new THREE.Box3().setFromObject(courtyard);

assert(clock.children.some(c=>c.name==='clock housing'),'The rooftop clock needs a visible housing');
assert(clock.children.some(c=>c.name==='four-sided clock roof'),'The rooftop clock needs a pitched roof');
assert(clock.children.every(c=>c.geometry?.attributes.position?.count>0),'Empty rooftop clock geometry');
assert(towerBox.max.y<=1.1+49.75+0.015,'Clock exceeds official document library height');
assert(towerBox.min.y>=1.1,'Clock below reference datum');
assert(courtyard.children.some(c=>c.name==='outer granite landing ring'),'Circular court paving absent');
assert(courtyard.children.some(c=>c.name==='forecourt railing / 40 steel posts'),'Guardrail absent');
assert(courtyard.children.some(c=>c.name==='recessed court / non-excavated dark ground indication'),'Recessed courtyard visually absent');
const courtyardCenter=[x,front+20.6];
assert(!source.buildings.some(b=>pointIn(courtyardCenter,b.points)),'Courtyard center overlaps OSM building');
const R=11.55;
for(let i=0;i<72;i++){
 const angle=i/72*Math.PI*2;
 const point=[courtyardCenter[0]+Math.cos(angle)*R,courtyardCenter[1]+Math.sin(angle)*R];
 assert(source.boundary.some(p=>pointIn(point,p)),'Library courtyard outside campus border');
 assert(!source.buildings.some(b=>pointIn(point,b.points)),'Library courtyard rim overlaps a mapped building');
}
assert(courtyardBox.max.y<1.1+3.2,'Courtyard railing/pedestal grows to impossible height');
const app=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
assert(app.includes('https://www.xinhuanet.com/20261013/d42e47404e3c4ab6b336946bc42d276a/c.html'),'Missing latest public exterior photo/news link');
assert(app.includes('https://news.xjtu.edu.cn/info/1079/52073.htm'),'Missing official courtyard reference link');
const world=fs.readFileSync(new URL('../src/world.js',import.meta.url),'utf8');
assert(world.includes('this.libraryClock=createLibraryClock(')||world.includes('this.libraryAsset=createLibraryAsset('),'Library clock not owned by legacy or R11 asset');
assert(world.includes('this.libraryForecourt=createLibraryForecourt('),'Forecourt not integrated');
assert(world.includes('const library=p.osmId===263624481'),'Photo-guided camera focus not enabled');
const after=world.substring(world.indexOf('this.libraryForecourt=createLibraryForecourt('),world.indexOf('this.libraryForecourt=createLibraryForecourt(')+420);
assert(!after.includes('this.textSign('),'Duplicate name on front of library');
console.log(JSON.stringify({passed:true,clockMaxY:Number(towerBox.max.y.toFixed(2)),maxAllowed:50.85,courtyardCenter,courtyardRadius:R,geometryCount:clock.children.length+courtyard.children.length}));
