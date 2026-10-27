import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createLibraryClock} from '../src/library-clock.js';
import {createLibraryForecourt} from '../src/library-forecourt.js';
import {createLibraryFacade} from '../src/library-facade.js';
import {bounds,pointIn} from '../src/geo.js';
import {createLibraryAsset} from '../src/library-asset.js';
import {integrateLibraryWorld} from './library-r11-integration.mjs';

const data=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const library=data.buildings.find(p=>p.osmId===263624481);
assert(library?.height===49.75,'Official documented library height missing');
const bb=bounds(library.points),centerX=(bb[0]+bb[2])/2,baseY=1.1;
const frontZ=bb[3],backZ=bb[3]-21;
const clock=createLibraryClock({centerX,steppedCenterZ:backZ,baseY});
const facade=createLibraryFacade({centerX,stairFrontZ:frontZ,steppedCenterZ:backZ,baseY});
const court=createLibraryForecourt({centerX,facadeFrontZ:frontZ,baseY});
const groups=[facade,clock,court];
for(const obj of groups){
 const box=new THREE.Box3().setFromObject(obj);
 assert([...box.min.toArray(),...box.max.toArray()].every(Number.isFinite),'Invalid model coordinates: '+obj.name);
 assert(box.min.y>=baseY-.3,'Library reconstruction sinks below mapped campus plane');
 assert(box.max.y<=baseY+49.75,'Library reconstruction exceeds officially documented max height');
}
const faces=facade.children.filter(x=>x.isMesh);
assert.equal(faces.length,5,'Facade no longer batches its five PBR materials');
assert(facade.children.some(x=>x.name.includes('Library name'))===false,'Node test without DOM should not create texture');
const facadeGlass=faces.find(m=>m.name.endsWith('/ glass'));
const boxes=new THREE.Box3().setFromObject(facadeGlass);
assert(boxes.max.x-boxes.min.x>62,'Library glass atrium must be broad, as in real exterior photographs');
assert(clock.children.some(x=>x.name==='clock housing'));
assert(clock.children.some(x=>x.name==='roof finial'));
assert(court.children.some(x=>x.name==='curved apparent-sunken-court retaining wall'));
assert(court.children.some(x=>x.name==='forecourt railing / 40 steel posts'));
const cz=frontZ+20.6;
assert(!data.buildings.some(b=>pointIn([centerX,cz],b.points)),'Courtyard center intersects mapped library/other building');
assert(data.boundary.some(poly=>pointIn([centerX,cz],poly)),'Courtyard center is outside campus');
const world=fs.readFileSync(new URL('../src/world.js',import.meta.url),'utf8');
const worlds=world.includes('this.libraryAsset=createLibraryAsset(')?[world]:[world,integrateLibraryWorld(world.replaceAll('\r\n','\n'))];
for(const text of worlds){
 if(text.includes('this.libraryAsset=createLibraryAsset(')){
  assert(text.includes('includeLibrary:false'),'Legacy north library overlay not retired');
  assert(!text.includes('this.libraryFacade=createLibraryFacade(')&&!text.includes('this.libraryClock=createLibraryClock('),'Duplicate library owners retained');
  assert(text.includes('this.libraryAsset.traverse(mesh=>{if(mesh.isMesh)this.pickables.push(mesh);})'),'Owned model not pickable');
  const owned=createLibraryAsset({building:library,baseY});
  assert.equal(owned.userData.owner,'library-asset.js');
  assert.deepEqual(owned.userData.entrances.map(e=>e.side).sort(),['north','south']);
  owned.dispose();
 }else assert(text.includes('createLibraryClock(')&&text.includes('createLibraryForecourt('),'Library assets are not in the 3D scene');
 assert(text.includes('createLibraryForecourt('),'Existing forecourt removed');
}
assert(!/this\.libraryForecourt\);this\.textSign\(/.test(world),'Old duplicate floating library name sign remains');
console.log(JSON.stringify({passed:true,clockElements:clock.children.length,forecourtElements:court.children.length,facadeGlassWidth:Math.round((boxes.max.x-boxes.min.x)*10)/10,location:[centerX,cz],heightLimit:49.75}));
