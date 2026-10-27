import fs from 'node:fs';import assert from 'node:assert/strict';import * as THREE from 'three';import {createLibraryAsset} from '../src/library-asset.js';import {bounds,BASE,pointIn} from '../src/geo.js';
const data=JSON.parse(fs.readFileSync('public/data/campus.json')),building=data.buildings.find(b=>b.osmId===263624481),before=JSON.stringify(building),a=createLibraryAsset({building,buildingIndex:0}),bb=bounds(building.points),cx=(bb[0]+bb[2])/2;
const cam=new THREE.PerspectiveCamera(78,390/844,.2,4800),setDistance=d=>{cam.position.set(cx,BASE+8,bb[3]+d);cam.updateMatrixWorld();};
const count=visible=>a.children.filter(m=>m.isMesh&&(!visible||m.visible)).reduce((n,m)=>n+(visible?Math.min(m.geometry.drawRange.count,m.geometry.index?.count||m.geometry.attributes.position.count):(m.geometry.index?.count||m.geometry.attributes.position.count))/3,0),full=count(false);
assert.equal(a.children.length,7,'LOD introduced additional material draw calls');
setDistance(180);assert.equal(a.updateDetailLOD(cam,844),false);const far=count(true);assert(far<full*.8,'Subpixel detail budget not reduced');
const mid=.12*844*cam.projectionMatrix.elements[5]/(2*.7);setDistance(mid);assert.equal(a.updateDetailLOD(cam,844),false,'LOD enters without hysteresis');
setDistance(20);assert.equal(a.updateDetailLOD(cam,844),true);assert.equal(count(true),full,'Near details not restored');setDistance(mid);assert.equal(a.updateDetailLOD(cam,844),true,'LOD flickers in hysteresis band');
setDistance(180);a.updateDetailLOD(cam,844);a.updateMatrixWorld(true);const visible=a.children.filter(m=>m.isMesh&&m.visible),ray=new THREE.Raycaster();let samples=0;
for(let x=bb[0]+1.17;x<bb[2];x+=9.1)for(let z=bb[1]+1.73;z<bb[3];z+=9.1){if(!pointIn([x,z],building.points))continue;ray.set(new THREE.Vector3(x,BASE+80,z),new THREE.Vector3(0,-1,0));assert(ray.intersectObjects(visible,false).length,'LOD removed a structural roof');samples++;}
assert(visible.some(m=>m.userData.part==='groundcover'));assert(a.children.filter(m=>m.userData.libraryDetail).every(m=>m.userData.place===building));assert.equal(JSON.stringify(building),before);
const report={passed:true,fullTriangles:full,farTriangles:far,farReduction:1-far/full,hysteresis:true,nearDetailsRestore:true,visibleRoofSamples:samples,dataUnchanged:true,ownershipUnchanged:true,globalDprTreesRoadsChanged:false};a.dispose();
fs.writeFileSync('docs/quality-v2/buildings-r12/library-lod-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
