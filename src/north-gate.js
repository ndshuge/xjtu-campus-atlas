import * as THREE from 'three';
// Interpretive reconstruction of XJTU Xingqing North Gate from 2011 photo;
// NOT current engineering survey, CAD, or photogrammetry.
export function createNorthGate(position,baseY=1.1){
 const [x,z]=position,g=new THREE.Group();
 g.name='Xingqing North Gate · curved canopy';
 const tile=new THREE.TextureLoader().load((import.meta.env?.BASE_URL||'./')+'assets/materials/north-ceramic-tiles.png');
 tile.colorSpace=THREE.SRGBColorSpace;tile.wrapS=tile.wrapT=THREE.RepeatWrapping;tile.repeat.set(32,2);tile.anisotropy=8;
 const stone=new THREE.MeshStandardMaterial({color:'#f5f5f1',map:tile,roughness:.86,side:THREE.DoubleSide});
 const gray=new THREE.MeshStandardMaterial({color:'#b9b9b3',roughness:.9,side:THREE.DoubleSide});
 const bronze=new THREE.MeshStandardMaterial({color:'#554841',metalness:.29,roughness:.7});
 const shade=new THREE.MeshStandardMaterial({color:'#868076',metalness:.3,roughness:.63});
 const add=(geo,mat,name,xx=0,yy=0,zz=0)=>{
  const m=new THREE.Mesh(geo,mat);m.name=name;m.position.set(xx,yy,zz);
  m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
 };
 const n=72,hw=38,front=-6.3,back=2.3;
 const roofY=t=>9.7+1.1*Math.pow(Math.abs(t),1.8);
 const roofZ=t=>front+2.0*t*t;
 function surface(name,mat,fn){
  const pos=[],uv=[],idx=[];
  for(let i=0;i<=n;i++){
   const t=i/n*2-1;
   const pair=fn(t);
   pos.push(...pair[0],...pair[1]);uv.push(i/n,0,i/n,1);
   if(i<n){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geo.setIndex(idx);geo.computeVertexNormals();return add(geo,mat,name);
 }
 surface('sweeping white gate roof',stone,t=>[[x+hw*t,baseY+roofY(t),z+roofZ(t)],[x+hw*t,baseY+roofY(t)-2.55,z+roofZ(t)]]);
 surface('top of tiled canopy',stone,t=>[[x+hw*t,baseY+roofY(t)+.14,z+roofZ(t)],[x+hw*t,baseY+roofY(t)+.14,z+back]]);
 surface('roof soffit',gray,t=>[[x+hw*t,baseY+roofY(t)-2.55,z+roofZ(t)],[x+hw*t,baseY+roofY(t)-2.55,z+back]]);
 for(const side of [-1,1]){
  const sx=x+side*12.7;
  add(new THREE.BoxGeometry(3.4,7.5,3.7),stone,'inner gate pier',sx,baseY+3.75,z-1.2).rotation.z=side*.08;
  add(new THREE.CylinderGeometry(1.25,1.25,.18,32),shade,'pier medallion',sx,baseY+5.25,z-3.3).rotation.x=Math.PI/2;
  add(new THREE.BoxGeometry(20.2,6.2,5.8),stone,'outer wall',x+side*27.1,baseY+3.1,z+.6);
  add(new THREE.BoxGeometry(18.9,4.6,.22),bronze,'bronze science relief panel',x+side*27.2,baseY+3.45,z-2.42);
  for(let j=0;j<11;j++){
   const a=add(new THREE.BoxGeometry(.21,.6+(j%4)*.42,.12),shade,'relief motif',x+side*27.2+(j-5)*1.6,baseY+2.5+(j%3)*.22,z-2.58);
   a.rotation.z=j%2?.24:-.2;
  }
 }
 function sign(txt,w,px,font){
  const c=document.createElement('canvas');c.width=1600;c.height=200;
  const ctx=c.getContext('2d');ctx.clearRect(0,0,1600,200);
  ctx.fillStyle='#303633';ctx.font='bold '+font+'px Arial,"Microsoft YaHei",sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,800,104);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  const mesh=add(new THREE.PlaneGeometry(w,2.15),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,side:THREE.DoubleSide}),'front facade inscription',px,baseY+8.65,z+front-.24);
  mesh.rotation.y=Math.PI;mesh.castShadow=false;
 }
 const calligraphy=new THREE.TextureLoader().load((import.meta.env?.BASE_URL||'/')+'assets/reference/north-gate-calligraphy-crop.png');
 calligraphy.colorSpace=THREE.SRGBColorSpace;calligraphy.anisotropy=8;
 const photographed=add(new THREE.PlaneGeometry(26,2.38),new THREE.MeshBasicMaterial({map:calligraphy,side:THREE.DoubleSide,depthWrite:false}),'2011 photographed north gate inscription',x+16.8,baseY+8.6,z-6.58);
 photographed.rotation.y=Math.PI;photographed.castShadow=false;
 sign('JIAOTONG UNIVERSITY',29,x-16.8,90);
 g.userData={accuracy:'2011-photo-informed approximation, not surveyed',source:'Wikimedia Commons XJTU Main Gate.JPG / IronBlood'};
 return g;
}
