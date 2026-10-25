import * as THREE from 'three';

// Photo-informed Xingqing North Gate. Approximate geometry, not a survey.
export function createNorthGate(position,baseY=1.1){
 const [x,z]=position,group=new THREE.Group();group.name='XJTU Xingqing North Gate — photo-informed';
 const stone=new THREE.MeshStandardMaterial({color:'#e4e3dc',roughness:.86});
 const panel=new THREE.MeshStandardMaterial({color:'#665f55',metalness:.26,roughness:.71});
 const dark=new THREE.MeshStandardMaterial({color:'#303735',roughness:.6});
 const metal=new THREE.MeshStandardMaterial({color:'#a7b1b0',metalness:.4,roughness:.46});
 const add=(g,m,name,xp=x,yp=baseY,zp=z)=>{
  const mesh=new THREE.Mesh(g,m);mesh.name=name;mesh.position.set(xp,yp,zp);
  mesh.receiveShadow=true;mesh.castShadow=true;group.add(mesh);return mesh;
 };
 // Sweeping white concave entrance arch seen from Xian'ning West Road.
 // Roof is a horizontal curved band with an upward taper at the ends.
 const verts=[],indices=[],segs=56,half=37,depth=5.6;
 for(let i=0;i<=segs;i++){
  const t=i/segs,xx=(t*2-1)*half,raised=1.9*Math.pow(Math.abs(xx)/half,1.6);
  const front=z-3.6+2.8*Math.pow(xx/half,2);
  const top=baseY+8.45+raised;
  verts.push(x+xx,top,front-depth/2,x+xx,top,front+depth/2,x+xx,top-1.7,front-depth/2,x+xx,top-1.7,front+depth/2);
  if(i<segs){const a=i*4,b=a+4;for(const [p,q,r,s] of [[0,1,0,1],[0,2,0,2],[1,3,1,3]]){
   const ia=a+p,ib=a+q,ic=b+r,id=b+s;indices.push(ia,ib,ic,ib,id,ic);
  }}
 }
 const roof=new THREE.BufferGeometry();roof.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));roof.setIndex(indices);roof.computeVertexNormals();
 add(roof,stone,'sweeping white gate roof',0,0,0);
 for(const side of [-1,1]){
  const sx=x+side*30;
  add(new THREE.BoxGeometry(4,8.6,5.8),stone,'outer entry pier',sx,baseY+4.3,z-2);
  const relief=add(new THREE.BoxGeometry(6.2,4.7,.28),panel,'bronze science relief panel',x+side*33.2,baseY+4.3,z-5.05);
  relief.rotation.y=side*.04;
  const ribMat=new THREE.MeshStandardMaterial({color:'#847867',metalness:.32,roughness:.64});
  for(let k=0;k<7;k++){
   const rib=add(new THREE.BoxGeometry(.16,.95+(k%3)*.45,.17),ribMat,'relief ribs',x+side*(30.5+k*.81),baseY+2.6+(k%3)*.32,z-5.3);
   rib.rotation.z=.23*(k%2?1:-1);
  }
  add(new THREE.BoxGeometry(1.8,7.6,4.0),stone,'inner gate support',x+side*9.6,baseY+3.8,z-2);
 }
 const railing=add(new THREE.BoxGeometry(55,1.2,.14),metal,'lightweight gate railing',x,baseY+.7,z+1.2);
 railing.castShadow=false;
 for(let i=-26;i<=26;i+=2.2){
  const r=add(new THREE.BoxGeometry(.08,1.18,.14),metal,'railing vertical',x+i,baseY+.7,z+1.2);r.castShadow=false;
 }
 // Original Chinese/English name uses native canvas, not unlicensed textures.
 function sign(text,wide,atX,atY,atZ,fontSize){
  const c=document.createElement('canvas');c.width=1024;c.height=160;
  const ctx=c.getContext('2d');ctx.clearRect(0,0,1024,160);
  ctx.fillStyle='#26302d';ctx.font='bold '+fontSize+'px Arial,"Microsoft YaHei",sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,80);
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
  const lettering=add(new THREE.PlaneGeometry(wide,2.4),new THREE.MeshBasicMaterial({map,transparent:true,side:THREE.DoubleSide}),'gate lettering',atX,atY,atZ);lettering.rotation.y=Math.PI;
 }
 sign('交通大学',25,x-18,baseY+8.0,z-6.7,90);
 sign('JIAOTONG UNIVERSITY',27,x+18,baseY+8.1,z-6.7,58);
 group.userData={source:'XJTU official north gate photographs and Hui Shi Jie relief record',accuracy:'photo-informed approximate facade, no surveyed CAD or BIM',reference:'https://dwxcb.xjtu.edu.cn/info/1085/17811.htm'};
 return group;
}
