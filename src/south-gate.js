import * as THREE from 'three';

// Photo-informed South Gate model. Historic 2011 Commons reference.
// Coordinates from two OSM gate nodes; dimensions and present-day status not surveyed.
export function createSouthGate(position,baseY=1.1){
 const [x,z]=position,group=new THREE.Group();
 group.name='XJTU Xingqing South Gate — historic-photo interpretation';
 const plaque=new THREE.MeshStandardMaterial({color:'#98574b',roughness:.74});
 const edges=new THREE.MeshStandardMaterial({color:'#62594c',roughness:.83});
 const concrete=new THREE.MeshStandardMaterial({color:'#e0dfd6',roughness:.86});
 const glazing=new THREE.MeshStandardMaterial({color:'#333a39',roughness:.41,metalness:.22});
 const gold=new THREE.MeshStandardMaterial({color:'#d8b66b',roughness:.33,metalness:.65});
 const frame=new THREE.MeshStandardMaterial({color:'#9a9f9b',roughness:.62,metalness:.3});
 const add=(geo,material,name,xp=x,yp=baseY,zp=z)=>{
  const mesh=new THREE.Mesh(geo,material);mesh.name=name;mesh.position.set(xp,yp,zp);
  mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
 };
 // Broad southern nameplate and low plinth, with clearly differentiated massing.
 add(new THREE.BoxGeometry(27,.42,3),edges,'sign plinth',x,baseY+.21,z+2.5);
 add(new THREE.BoxGeometry(26.5,3.65,2.3),plaque,'red granite sign wall',x,baseY+2.05,z+2.7);
 add(new THREE.BoxGeometry(26.8,.23,2.5),edges,'sign cap',x,baseY+3.94,z+2.7);
 // Central seal, simplified circular representation.
 // The historical photographic facade texture includes the central university seal.
 // Photo facade includes historic real calligraphy, bilingual name and seal.
 const historicTexture=new THREE.TextureLoader().load((import.meta.env?.BASE_URL||'./')+'assets/reference/south-gate-signage-crop.png');
 historicTexture.colorSpace=THREE.SRGBColorSpace;historicTexture.anisotropy=8;
 const historicFacade=add(new THREE.PlaneGeometry(26.3,3.5),new THREE.MeshBasicMaterial({map:historicTexture,side:THREE.DoubleSide}),'2011 photographed south gate signage',x,baseY+2.05,z+3.97);
 historicFacade.castShadow=false;
 // Fence beside the sign, not an invented solid wall spanning the whole road.
 for(const side of [-1,1]){
  add(new THREE.BoxGeometry(11,1.2,.16),frame,'side guard rail',x+side*20,baseY+1.3,z);
  for(let j=-5;j<=5;j+=2){
   add(new THREE.BoxGeometry(.11,1.4,.16),frame,'guard rail spindle',x+side*20+j,baseY+1.1,z);
  }
 }
 // Low entrance building behind the sign, reminiscent of the distinct
 // flat-roof mass and central recessed tower in the historic picture.
 add(new THREE.BoxGeometry(29,4.7,13),concrete,'back entrance building',x,baseY+2.35,z-11);
 add(new THREE.BoxGeometry(30,1.2,15),edges,'projecting roof cornice',x,baseY+5.2,z-11);
 add(new THREE.BoxGeometry(21,2.3,2.3),glazing,'recessed glass entrance',x,baseY+2.2,z-3.6);
 add(new THREE.BoxGeometry(5,4.9,5.8),concrete,'roof lantern',x,baseY+8,z-12);
 add(new THREE.BoxGeometry(3.4,2.0,.3),glazing,'roof lantern opening',x,baseY+8.1,z-8.96);
 // Public flagstaff visible in the historical photo.
 add(new THREE.CylinderGeometry(.07,.09,8,10),frame,'flagpole',x,baseY+12,z-11);
 group.userData={
  source:'Wikimedia Commons XJTU Gate.jpg, Jucember, 2011 (CC BY-SA 3.0)',
  accuracy:'historic-photo-informed schematic; not a current architectural survey',
  positionBasis:'midpoint of two OSM South Gate points, not measured exterior'
 };
 return group;
}
