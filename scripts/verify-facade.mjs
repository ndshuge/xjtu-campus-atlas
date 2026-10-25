import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createLibraryFacade} from '../src/library-facade.js';
import {createMainTowerFacade} from '../src/main-tower-facade.js';

const baseY=1.1;
const front=-75.297;
const centerX=(-91.158+32.932)/2;
const facade=createLibraryFacade({centerX,stairFrontZ:front,steppedCenterZ:front-21,baseY});
const meshes=facade.children.filter(o=>o.isMesh);
assert.equal(meshes.length,5,'Expected five batched material groups');
let triangles=0;
for(const mesh of meshes){
  const positions=mesh.geometry.attributes.position;
  assert(positions?.count>0,'Missing geometry');
  assert([...positions.array].every(Number.isFinite),'Non-finite vertex');
  triangles+=(mesh.geometry.index?mesh.geometry.index.count:positions.count)/3;
}
const box=new THREE.Box3().setFromObject(facade);
assert(box.min.y>=baseY-.25,'Facade below campus surface');
assert(box.max.y<=baseY+49.75,'Facade exceeds documented library height');
assert(box.min.x>=-92&&box.max.x<=34,'Facade escapes OSM library longitude bounds');
assert(box.min.z>=-220&&box.max.z<front+10,'Facade is outside expected campus area');
const tower=createMainTowerFacade({footprint:[-51.705,105.159,-11.164,142.829],height:80.5,baseY});
assert.equal(tower.children.filter(o=>o.isMesh).length,4,'Main tower material batching changed');
for(const mesh of tower.children){assert([...mesh.geometry.attributes.position.array].every(Number.isFinite),'Main tower non-finite vertex');}
const towerBox=new THREE.Box3().setFromObject(tower);
assert(towerBox.min.x>=-52.3&&towerBox.max.x<=-10.55,'Main tower facade extends over 0.6m outside east/west footprint');
assert(towerBox.min.z>=103.6&&towerBox.max.z<=144.4,'Main tower decorative frame extends over 1.6m outside north/south footprint');
assert(towerBox.min.y>=baseY&&towerBox.max.y<=baseY+80.5,'Main tower exceeds estimated height');
console.log(JSON.stringify({passed:true,library:{batchedMeshes:meshes.length,triangles,bounds:{min:box.min.toArray(),max:box.max.toArray()}},mainTower:{batchedMeshes:tower.children.length,bounds:{min:towerBox.min.toArray(),max:towerBox.max.toArray()}}}));
