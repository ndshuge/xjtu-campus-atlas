import * as THREE from 'three';

// Photo-informed South Gate model. Historic 2011 Commons reference.
// Coordinates from two OSM gate nodes; dimensions and present-day status not surveyed.
export function createSouthGate(position,baseY=1.1){
 const [x,z]=position,group=new THREE.Group();
 // The two mapped South Gate nodes are open passages; the historic name wall
 // must NOT straddle either node. Sign-to-passages alignment is approximate.
 const signX=x-31;
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
 add(new THREE.BoxGeometry(27,.42,3),edges,'sign plinth',signX,baseY+.21,z+2.5);
 add(new THREE.BoxGeometry(26.5,3.65,2.3),plaque,'red granite sign wall',signX,baseY+2.05,z+2.7);
 add(new THREE.BoxGeometry(26.8,.23,2.5),edges,'sign cap',signX,baseY+3.94,z+2.7);
 // Central seal, simplified circular representation.
 // The historical photographic facade texture includes the central university seal.
 // Photo facade includes historic real calligraphy, bilingual name and seal.
 const historicTexture=new THREE.TextureLoader().load((import.meta.env?.BASE_URL||'./')+'assets/reference/south-gate-signage-crop.png');
 historicTexture.colorSpace=THREE.SRGBColorSpace;historicTexture.anisotropy=8;
 const historicFacade=add(new THREE.PlaneGeometry(26.3,3.5),new THREE.MeshBasicMaterial({map:historicTexture,side:THREE.DoubleSide}),'2011 photographed south gate signage',signX,baseY+2.05,z+3.97);
 historicFacade.castShadow=false;
 // Other rail and back-building shapes in the 2011 image are NOT georeferenced.
 // They are deliberately omitted to keep the two present OSM gate corridors clear.
 group.userData={
  source:'Wikimedia Commons XJTU Gate.jpg, Jucember, 2011 (CC BY-SA 3.0)',
  accuracy:'historic-photo-informed schematic; not a current architectural survey',
  positionBasis:'2011 wall visual, shown offset from both OSM gate lanes; lateral offset unverified',
  estimatedOpenCorridors:'OSM South Gate nodes remain unobstructed; not certified clearances'
 };
 return group;
}
