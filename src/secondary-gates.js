import * as THREE from 'three';

// Lightweight entry locator for OSM-confirmed side entrances.
// Grounded placement, approximate form: NOT an as-built gate or passage survey.
export function createSecondaryGate({position,name,baseY=1.1,orientation=0}){
 const [x,z]=position,group=new THREE.Group();
 group.name=name+' / approximate pedestrian entrance';
 const limestone=new THREE.MeshStandardMaterial({color:'#ddd9ce',roughness:.9});
 const darker=new THREE.MeshStandardMaterial({color:'#7b7a70',roughness:.77});
 const steel=new THREE.MeshStandardMaterial({color:'#87918d',roughness:.45,metalness:.5});
 const add=(geometry,material,label,atX=0,atY=0,atZ=0)=>{
  const m=new THREE.Mesh(geometry,material);m.name=label;m.position.set(atX,atY,atZ);
  m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
 };
 // Left/right gateways span an open passage rather than blocking movement.
 for(const side of [-1,1]){
  add(new THREE.BoxGeometry(2.0,4.6,2.6),limestone,'pedestrian entrance pillar',side*7.2,2.3,0);
  add(new THREE.BoxGeometry(2.45,.48,2.9),darker,'pillar cap',side*7.2,4.57,0);
  add(new THREE.BoxGeometry(.22,1.9,.22),steel,'access-frame rail',side*5.9,2.1,0);
 }
 const canopy=add(new THREE.BoxGeometry(17.8,.45,3.1),limestone,'simple access canopy',0,4.85,0);
 canopy.castShadow=false;
 add(new THREE.BoxGeometry(6.7,.18,.2),darker,'information plate',0,4.18,-1.61);
 group.position.set(x,baseY,z);group.rotation.y=orientation;
 group.userData={accuracy:'schematic access marker; real gate architecture unverified',name,source:'OSM entrance point',notForNavigation:true};
 return group;
}
