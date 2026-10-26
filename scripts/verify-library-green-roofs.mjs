import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createLibraryAsset} from '../src/library-asset.js';
import {integrateLibraryWorld} from './library-r11-integration.mjs';
import {createLibraryGreenRoofs} from '../src/library-green-roofs.js';
import {LIBRARY_TIERS} from '../src/library-facade.js';
import {bounds} from '../src/geo.js';

const data=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const library=data.buildings.find(b=>b.osmId===263624481);
assert(library,'Missing original OSM footprint for library');
const bb=bounds(library.points),baseY=1.1;
const group=createLibraryGreenRoofs({centerX:(bb[0]+bb[2])/2,steppedCenterZ:bb[3]-21,baseY});
assert.equal(group.children.length,12,'Expected 12 physically wide enough planted strips across four terraces; omit sub-45cm gaps');
assert(group.userData.published==='2017-04-07','Official dated roof reference missing');
assert(group.userData.documentedType.includes('Class C'),'Wrong planting class');
assert(group.userData.asOf2026.includes('Unverified'),'Must not claim planting verified for 2026');
assert(group.children.every(m=>m.isMesh&&!m.castShadow&&m.receiveShadow),'Green roofs must be lightweight visible meshes');
const box=new THREE.Box3().setFromObject(group);
assert(box.min.y>baseY+13,'Groundcover should not appear at ground level');
assert(box.max.y<baseY+13+LIBRARY_TIERS.at(-1).h,'Groundcover must not cover rooftop clock');
assert(box.min.x>=bb[0]-1&&box.max.x<=bb[2]+1,'Terrace escapes mapped library lateral footprint');
for(const m of group.children){
 const arr=m.geometry.attributes.position.array;
 assert([...arr].every(Number.isFinite),'Invalid turf geometry');
 assert(m.material.map?.isDataTexture,'No procedural groundcover texture');
}
const world=fs.readFileSync(new URL('../src/world.js',import.meta.url),'utf8');
const worlds=world.includes('this.libraryAsset=createLibraryAsset(')?[world]:[world,integrateLibraryWorld(world.replaceAll('\r\n','\n'))];
for(const text of worlds){
 if(text.includes('this.libraryAsset=createLibraryAsset(')){
  assert(!text.includes('this.libraryGreenRoofs=createLibraryGreenRoofs('),'Duplicate green roof owner retained');
  const owned=createLibraryAsset({building:library,baseY}),roof=owned.children.find(m=>m.userData.part==='groundcover');
  assert(roof?.material.map?.isDataTexture,'Unified asset loses original procedural groundcover');
  const bb=new THREE.Box3().setFromObject(roof);assert(bb.min.y>=baseY+13-.001&&bb.max.y<baseY+42.75,'Green roof loses support or covers clock');
  owned.dispose();
 }else assert(text.includes('this.libraryGreenRoofs=createLibraryGreenRoofs('),'Green roof not actually integrated into world');
}
console.log(JSON.stringify({passed:true,roofStrips:group.children.length,roofBounds:{min:box.min.toArray(),max:box.max.toArray()},source:group.userData.source,license:'generated texture, no copied image'}));
