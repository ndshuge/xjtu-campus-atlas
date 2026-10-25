import * as THREE from 'three';

// Clock cupola identified in 2026 campus-library exterior reporting and
// university historical photos. Geometry is independent of footprint and
// capped below the documented 49.75 m library height.
export function createLibraryClock({centerX,steppedCenterZ,baseY=1.1}){
 const group=new THREE.Group();
 group.name='Qian Xuesen Library / rooftop clock cupola';
 const stone=new THREE.MeshStandardMaterial({color:'#bcb6a8',roughness:.86});
 const topStone=new THREE.MeshStandardMaterial({color:'#9d9b93',roughness:.82});
 const dark=new THREE.MeshStandardMaterial({color:'#404443',roughness:.7});
 const add=(geo,mat,name,x=centerX,y=0,z=steppedCenterZ+8.4)=>{
  const mesh=new THREE.Mesh(geo,mat);
  mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
 };
 add(new THREE.BoxGeometry(5.8,.5,4.3),topStone,'clock foundation plinth',centerX,baseY+43.35);
 add(new THREE.BoxGeometry(4.7,4.15,3.25),stone,'clock housing',centerX,baseY+45.55);
 for(const side of [-1,1])add(new THREE.BoxGeometry(.28,4.05,.42),topStone,'clock pilaster',centerX+side*2.2,baseY+45.58,steppedCenterZ+10.02);
 add(new THREE.BoxGeometry(5.2,.35,3.8),topStone,'clock upper cornice',centerX,baseY+47.82);
 const roof=add(new THREE.ConeGeometry(2.9,1.18,4,1),topStone,'four-sided clock roof',centerX,baseY+48.50);
 roof.rotation.y=Math.PI/4;
 add(new THREE.CylinderGeometry(.15,.18,.57,12),dark,'roof finial',centerX,baseY+49.14);
 if(typeof document!=='undefined'){
  const cv=document.createElement('canvas');cv.width=cv.height=512;
  const ctx=cv.getContext('2d');
  if(ctx){
   ctx.fillStyle='#dddcd2';ctx.fillRect(0,0,512,512);
   ctx.fillStyle='#f3f0e7';ctx.fillRect(38,38,436,436);
   ctx.strokeStyle='#4c514f';ctx.lineWidth=14;ctx.strokeRect(40,40,432,432);
   ctx.beginPath();ctx.arc(256,256,170,0,Math.PI*2);
   ctx.lineWidth=12;ctx.stroke();
   for(let i=0;i<12;i++){
    const a=i*Math.PI/6-Math.PI/2;
    const r1=i%3===0?134:146;
    ctx.beginPath();ctx.moveTo(256+Math.cos(a)*r1,256+Math.sin(a)*r1);
    ctx.lineTo(256+Math.cos(a)*164,256+Math.sin(a)*164);
    ctx.lineWidth=i%3===0?8:4;ctx.stroke();
   }
   for(const [angle,length,width] of [[-Math.PI/3,100,12],[Math.PI/3,136,8]]){
    ctx.beginPath();ctx.moveTo(256,256);
    ctx.lineTo(256+Math.cos(angle)*length,256+Math.sin(angle)*length);
    ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();
   }
   ctx.beginPath();ctx.arc(256,256,12,0,Math.PI*2);ctx.fillStyle='#414643';ctx.fill();
   const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=8;
   const m=add(new THREE.PlaneGeometry(3.9,3.5),
    new THREE.MeshBasicMaterial({map:tx,side:THREE.FrontSide,depthWrite:false}),
    'clock face facing entrance',centerX,baseY+45.70,steppedCenterZ+10.081);
   m.castShadow=false;
  }
 }
 group.userData={
  accuracy:'clock face placement and roof inferred from exterior photos, not surveyed',
  maxBuildingHeight:49.75,
  reference:'https://www.xinhuanet.com/20261013/d42e47404e3c4ab6b336946bc42d276a/c.html'
 };
 return group;
}
