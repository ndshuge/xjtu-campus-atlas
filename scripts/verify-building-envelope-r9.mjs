import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {facadeEdges} from '../src/building-envelope.js';
import {createBuildingSilhouettes} from '../src/building-silhouettes.js';
import {createLibraryFacade} from '../src/library-facade.js';
import {createMainTowerFacade,mainTowerMassing} from '../src/main-tower-facade.js';
import {createScienceHall} from '../src/cultural-facades.js';
import {bounds,BASE,extrude} from '../src/geo.js';
const data=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url))),before=JSON.stringify(data.buildings);
const by=id=>data.buildings.find(b=>b.osmId===id),lib=by(263624481),main=by(263624057),hall=by(263632364);
const overlay=createBuildingSilhouettes(data.buildings),bb=bounds(lib.points),cx=(bb[0]+bb[2])/2;
const library=createLibraryFacade({centerX:cx,stairFrontZ:bb[3],steppedCenterZ:bb[3]-21,baseY:BASE,footprint:lib.points});
const tower=createMainTowerFacade({footprint:bounds(main.points),height:main.height,baseY:BASE});
const science=createScienceHall({footprint:bounds(hall.points),height:hall.height,baseY:BASE});
const model=new THREE.Group();model.add(overlay,library,tower,science);model.updateMatrixWorld(true);
for(const group of [overlay,library,tower,science])group.traverse(o=>{
 if(!o.isMesh)return;assert([...o.geometry.attributes.position.array].every(Number.isFinite));
 assert(o.material.opacity===1&&!o.material.transparent,'Facade backing must occlude the generic window shader');
});
// Real ray visibility checks against the retained source volume, not counts of
// calls or source-string snapshots: the first surface must be dedicated skin.
const coverage=[];
for(const id of [263624481,263624058,263624059,263624060,263624061,263632364]){
 const building=by(id),generic=new THREE.Mesh(extrude(building.points,id===263624481?13:building.height,BASE),new THREE.MeshBasicMaterial());generic.name='generic backing';
 const scene=new THREE.Group();scene.add(generic,model);scene.updateMatrixWorld(true);
 let checked=0;
 for(const e of facadeEdges(building.points).filter(e=>e.length>12)){
  const p=[(e.a[0]+e.c[0])/2,(e.a[1]+e.c[1])/2],origin=new THREE.Vector3(p[0]+e.nx*2,BASE+4.2,p[1]+e.nz*2);
  const ray=new THREE.Raycaster(origin,new THREE.Vector3(-e.nx,0,-e.nz),0,3),hit=ray.intersectObject(scene,true)[0];
  assert(hit&&hit.object!==generic,'Generic windows still in front of dedicated facade '+id);checked++;
 }
 coverage.push({osmId:id,wallSamples:checked});scene.remove(model);model.updateMatrixWorld(true);
}
const north=overlay.children[1];assert.equal(north.userData.legacyDuplicateWindowBands,0);
assert.equal(north.userData.perimeterOwner,'library-facade.js / R7');
assert.equal(new THREE.Box3().setFromObject(north).max.y<BASE+14.01,true,'North colonnade changes the retained R7 height');
// The old inner fins crossed the clear opening at x = centre +/- 11m.
const mb=bounds(main.points),mc=(mb[0]+mb[2])/2,portal=mainTowerMassing(mb,main.height,BASE).portal;
tower.updateMatrixWorld(true);
for(const side of [-1,1])for(const dx of [-11,11]){
 const ray=new THREE.Raycaster(new THREE.Vector3(mc+dx,portal.bottom+8,side<0?mb[1]-5:mb[3]+5),new THREE.Vector3(0,0,side<0?1:-1));
 assert.equal(ray.intersectObject(tower,true).length,0,'Facade fin occludes the open Main E portal');
}
for(const side of [-1,1]){
 const ray=new THREE.Raycaster(new THREE.Vector3(mb[0]+3.6,portal.bottom+8,side<0?mb[1]-5:mb[3]+5),new THREE.Vector3(0,0,side<0?1:-1));
 assert(ray.intersectObject(tower,true).length>0,'Opening test must also retain its outer support piers');
}
assert.equal(science.userData.curtainWallFolds,2);assert.equal(science.userData.roofFrame.posts,4);
const sb=new THREE.Box3().setFromObject(science);assert(sb.max.y<BASE+hall.height+4.3);
science.updateMatrixWorld(true);
const glassX=[];
for(const z of [-20,-12.0355,-4]){
 const ray=new THREE.Raycaster(new THREE.Vector3(40,BASE+12,z),new THREE.Vector3(1,0,0));
 const hit=ray.intersectObject(science,true)[0];assert(hit&&/\/ (glass|frame)$/.test(hit.object.name),'Curtain wall hidden by stone or generic backing');glassX.push(hit.point.x);
}
assert(glassX[1]<Math.min(glassX[0],glassX[2])-.25,'West curtain wall lost its visible central fold');
const steel=science.children.find(m=>m.name.endsWith('/ frame')).geometry.attributes.position;
for(const node of [science.userData.roofFrame.apex,...science.userData.roofFrame.corners.map(([x,z])=>[x,BASE+hall.height+.9,z])]){
 let closest=Infinity;for(let i=0;i<steel.count;i++)closest=Math.min(closest,Math.hypot(steel.getX(i)-node[0],steel.getY(i)-node[1],steel.getZ(i)-node[2]));
 assert(closest<.18,'Roof frame has a missing beam junction');
}
assert.equal(JSON.stringify(data.buildings),before,'Source footprint/height mutated');
console.log(JSON.stringify({passed:true,coverage,legacyNorthWindowBands:0,mainPortalClear:true,scienceFoldAndRoof:true,sourceUnchanged:true}));
