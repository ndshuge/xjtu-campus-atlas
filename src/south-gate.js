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
 add(new THREE.BoxGeometry(47,.42,3),edges,'sign plinth',x,baseY+.21,z+2.5);
 add(new THREE.BoxGeometry(46.5,2.7,2.3),plaque,'red granite sign wall',x,baseY+1.66,z+2.7);
 add(new THREE.BoxGeometry(46.8,.23,2.5),edges,'sign cap',x,baseY+3.12,z+2.7);
 // Central seal, simplified circular representation.
 const medallion=add(new THREE.CylinderGeometry(.93,.93,.14,64),gold,'center university seal',x,baseY+1.85,z+3.92);
 medallion.rotation.x=Math.PI/2;
 const medInner=add(new THREE.CylinderGeometry(.69,.69,.15,64),edges,'seal inner medallion',x,baseY+1.85,z+4.04);
 medInner.rotation.x=Math.PI/2;
 function lettering(text,cx,sz,color='#e0c47f'){
  const c=document.createElement('canvas');c.width=1536;c.height=220;
  const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
  ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='bold '+sz+'px Arial,"Microsoft YaHei",sans-serif';
  ctx.fillText(text,768,113);
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
  add(new THREE.PlaneGeometry(22,2.1),new THREE.MeshBasicMaterial({map,transparent:true,side:THREE.DoubleSide}),'name inscription',cx,baseY+2.03,z+3.93);
 }
 lettering('西安交通大学',x-12.4,130);
 lettering("XI'AN JIAOTONG UNIVERSITY",x+12.6,88);
 // Fence beside the sign, not an invented solid wall spanning the whole road.
 for(const side of [-1,1]){
  add(new THREE.BoxGeometry(20,1.2,.16),frame,'side guard rail',x+side*34,baseY+1.3,z);
  for(let j=-9;j<=9;j+=2){
   add(new THREE.BoxGeometry(.11,1.4,.16),frame,'guard rail spindle',x+side*34+j,baseY+1.1,z);
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
