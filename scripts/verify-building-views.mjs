import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildingGroupFrame,libraryEntranceFrame,landmarkEntranceFrame} from '../src/building-views.js';
import {BASE,pointIn} from '../src/geo.js';
const data=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url)));
const results=[];
for(const id of [263624481,263624057,263632364])for(const width of [1440,390]){
 const place=data.buildings.find(b=>b.osmId===id),height=width===390?844:900,f=buildingGroupFrame(place,data.buildings,width,height);
 const camera=new THREE.PerspectiveCamera(f.fov,width/height,.6,10000);camera.position.fromArray(f.position);camera.lookAt(new THREE.Vector3(...f.target));camera.updateMatrixWorld();
 let maxX=0,maxY=0;
 for(const x of [f.bounds[0],f.bounds[2]])for(const z of [f.bounds[1],f.bounds[3]])for(const y of [BASE,BASE+f.top]){
  const p=new THREE.Vector3(x,y,z).project(camera);assert(p.z>-1&&p.z<1);maxX=Math.max(maxX,Math.abs(p.x));maxY=Math.max(maxY,Math.abs(p.y));
 }
 assert(maxX<f.marginX&&maxY<f.marginY,'Mapped compound clipped in viewport');
 assert(f.position[1]>BASE+f.top,'Camera is below the compound roofs');
 if(id===263624057)assert.equal(f.ids.length,5,'Main A-E wings must be framed together');
 results.push({name:place.name,width,members:f.ids.length,maxNdc:[+maxX.toFixed(3),+maxY.toFixed(3)]});
}
const entrances=[];
for(const id of [263625088,1167525875,263624056])for(const width of [1440,390,430]){
 const height=width===1440?900:844,place=data.buildings.find(b=>b.osmId===id),f=landmarkEntranceFrame(place,width,height);
 const camera=new THREE.PerspectiveCamera(f.fov,width/height,.6,10000);camera.position.fromArray(f.position);camera.lookAt(new THREE.Vector3(...f.target));camera.updateMatrixWorld();
 for(const x of [f.bounds[0],f.bounds[2]])for(const z of [f.bounds[1],f.bounds[3]])for(const y of [BASE,BASE+f.top]){
  const v=new THREE.Vector3(x,y,z).project(camera);assert(Math.abs(v.x)<f.marginX&&Math.abs(v.y)<f.marginY,'Landmark clipped: '+place.name);
 }
 assert(id===263625088?f.position[2]<f.bounds[1]:id===1167525875?f.position[0]<f.bounds[0]:f.position[2]>f.bounds[3],'Camera is behind the intended facade');
 entrances.push({name:place.name,width,position:f.position,fov:f.fov});
}
for(const width of [1440,390]){
 const height=width===390?844:900,lib=data.buildings.find(b=>b.osmId===263624481),f=libraryEntranceFrame(lib,data.buildings,width,height);
 assert(!data.buildings.some(b=>pointIn([f.position[0],f.position[2]],b.points)),'Near view still sits above a neighbouring building');
 assert(f.fov<115,'Lens too wide; re-evaluate the square viewpoint');
 const camera=new THREE.PerspectiveCamera(f.fov,width/height,.6,10000);camera.position.fromArray(f.position);camera.lookAt(new THREE.Vector3(...f.target));camera.updateMatrixWorld();
 for(const x of [f.bounds[0],f.bounds[2]])for(const z of [f.bounds[1],f.bounds[3]])for(const y of [BASE,BASE+f.top]){
  const v=new THREE.Vector3(x,y,z).project(camera);assert(Math.abs(v.x)<f.marginX&&Math.abs(v.y)<f.marginY,'South mass cropped');
 }
 entrances.push({width,position:f.position,fov:+f.fov.toFixed(2)});
}
console.log(JSON.stringify({passed:true,results,entrances}));
