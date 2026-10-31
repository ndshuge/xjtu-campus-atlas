import * as THREE from 'three';
import {flat} from './geo.js';
// An isolated measured-fixture demonstration only: not an unlicensed library excavation.
export function createIsolatedLevelPatch({outer,hole,upperY,lowerY,kind}){
 if(kind!=='fixture'||![upperY,lowerY].every(Number.isFinite)||lowerY>=upperY)
  throw Error('verified numeric heights required before excavation');
 const group=new THREE.Group();
 group.name='R17 isolated multi-level fixture';
 group.userData={fixtureOnly:true,notCampusSurvey:true};
 const stone=new THREE.MeshStandardMaterial({color:0xbfbeb7,side:THREE.DoubleSide});
 const floor=new THREE.MeshStandardMaterial({color:0x858f8d,side:THREE.DoubleSide});
 const top=new THREE.Mesh(flat(outer,upperY,[hole]),stone);
 top.name='upper aperture / actual central hole';group.add(top);
 const below=new THREE.Mesh(flat(hole,lowerY),floor);
 below.name='lower actual floor';group.add(below);
 // Side walls connect lower fixture floor to the hole edge, no fake full backing plane.
 const height=upperY-lowerY;
 for(let i=0;i<hole.length;i++){
  const a=hole[i],b=hole[(i+1)%hole.length],dx=b[0]-a[0],dz=b[1]-a[1];
  const geo=new THREE.BoxGeometry(Math.hypot(dx,dz),height,.15);
  const mesh=new THREE.Mesh(geo,stone);
  mesh.position.set((a[0]+b[0])/2,(upperY+lowerY)/2,(a[1]+b[1])/2);
  mesh.rotation.y=-Math.atan2(dz,dx);
  mesh.name='retaining-wall-fixture';group.add(mesh);
 }
 return group;
}
