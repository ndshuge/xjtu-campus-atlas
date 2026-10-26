import * as THREE from 'three';

// Lightweight entry locator for OSM-confirmed side entrances.
// Grounded placement, approximate form: NOT an as-built gate or passage survey.
export function createSecondaryGate({position,name,baseY=1.1,orientation=0}){
 const [x,z]=position,group=new THREE.Group();
 group.name=name+' / approximate pedestrian entrance';
 // Survey-free entrance: intentionally unornamented locator, not a fabricated gate.
 const limestone=new THREE.MeshStandardMaterial({color:'#a9b5ac',roughness:1,transparent:true,opacity:.86});
 const darker=new THREE.MeshStandardMaterial({color:'#748479',roughness:1});
 const steel=new THREE.MeshStandardMaterial({color:'#c7d0ca',roughness:1});
 const add=(geometry,material,label,atX=0,atY=0,atZ=0)=>{
  const m=new THREE.Mesh(geometry,material);m.name=label;m.position.set(atX,atY,atZ);
  m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
 };
 // Open 11.6-m schematic corridor. No roof, invented stone or unsupported ornament.
 for(const side of [-1,1]){
  add(new THREE.BoxGeometry(.32,2.9,.34),limestone,'schematic boundary locator',side*7.2,1.45,0);
  add(new THREE.BoxGeometry(.46,.18,.42),darker,'locator marker',side*7.2,2.85,0);
  add(new THREE.BoxGeometry(.12,1.6,.10),steel,'wayfinding notch',side*7.2,1.35,-.22);
 }
 group.position.set(x,baseY,z);group.rotation.y=orientation;
 group.userData={accuracy:'schematic access marker; real gate architecture unverified',name,source:'OSM entrance point',notForNavigation:true};
 return group;
}
