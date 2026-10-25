import * as THREE from 'three';

// Image-guided interpretation of the Qian Xuesen Library entrance courtyard.
// University image (2016): https://news.xjtu.edu.cn/info/1079/52073.htm
// Geometric measurements are estimates, not surveyed or photogrammetric.
// In particular the existing ground has not been excavated: dark center +
// annular granite paving suggest the sunk entrance courtyard without modifying
// registered OSM road/terrain surfaces.
export function createLibraryForecourt({centerX,facadeFrontZ,baseY=1.1}) {
 const group=new THREE.Group();
 group.name='Qian Xuesen Library / image-guided round entrance forecourt';
 const centerZ=facadeFrontZ+20.6;
 const pale=new THREE.MeshStandardMaterial({color:'#c8c3b9',roughness:.9});
 const step=new THREE.MeshStandardMaterial({color:'#aaa9a4',roughness:.86});
 const inset=new THREE.MeshStandardMaterial({color:'#858f8d',roughness:.9});
 const bronze=new THREE.MeshStandardMaterial({color:'#64615a',metalness:.45,roughness:.48});
 const rail=new THREE.MeshStandardMaterial({color:'#929d9a',metalness:.55,roughness:.38});
 const add=(geo,mat,name,x=centerX,y=baseY,z=centerZ)=>{
  const m=new THREE.Mesh(geo,mat);m.name=name;m.position.set(x,y,z);
  m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
 };
 // Thin, isolated concentric bands don't conflict with mapped footpaths.
 const ring=(name,inner,outer,y,mat)=>{
  const mesh=add(new THREE.RingGeometry(inner,outer,96,1),mat,name,centerX,y,centerZ);
  mesh.rotation.x=-Math.PI/2;mesh.castShadow=false;return mesh;
 };
 ring('outer granite landing ring',9.65,11.55,baseY+.115,pale);
 ring('middle stepped granite ring',8.5,9.62,baseY+.129,step);
 ring('inner courtyard lip',7.68,8.42,baseY+.144,pale);
 const glassInlay=add(new THREE.CircleGeometry(7.65,96),inset,
 'recessed court / non-excavated dark ground indication',centerX,baseY+.091,centerZ);
 glassInlay.rotation.x=-Math.PI/2;glassInlay.castShadow=false;
 // The university's 2016 photograph shows a visible curved inner wall
 // beneath the stainless rail, not a flat grey circle. A low open-ended
 // vertical cylinder supplies a shadowed apparent drop, while the underlying
 // OSM terrain remains untouched. This is a visual approximation only.
 const retaining=new THREE.MeshStandardMaterial({color:'#807f79',roughness:.95,side:THREE.DoubleSide});
 const innerWall=add(new THREE.CylinderGeometry(7.65,7.65,.57,96,1,true),
  retaining,'curved apparent-sunken-court retaining wall',
  centerX,baseY+.37,centerZ);
 innerWall.castShadow=false;
 ring('inner stone edge on retaining wall',7.62,8.03,baseY+.658,pale);
 // Use darker narrow annular bands to suggest the photographed concentric
 // steps without creating false cliffs or intersecting the mapped road.
 ring('granite shadow reveal',8.09,8.19,baseY+.167,retaining);
 ring('outer granite reveal',9.45,9.55,baseY+.158,retaining);
 // Polished steel perimeter handrail: 40 small posts + two concentric rails.
 const count=40;
 const posts=new THREE.InstancedMesh(new THREE.CylinderGeometry(.065,.07,1.04,8),rail,count);
 posts.name='forecourt railing / 40 steel posts';
 posts.castShadow=false;posts.receiveShadow=false;
 const transform=new THREE.Object3D();
 for(let i=0;i<count;i++){
  const theta=i/count*Math.PI*2;
  transform.position.set(centerX+Math.cos(theta)*10.72,baseY+.78,centerZ+Math.sin(theta)*10.72);
  transform.rotation.set(0,0,0);transform.scale.set(1,1,1);transform.updateMatrix();
  posts.setMatrixAt(i,transform.matrix);
 }
 posts.instanceMatrix.needsUpdate=true;group.add(posts);
 for(const [r,h,name] of [[10.72,1.3,'upper stainless railing'],[10.72,.88,'lower stainless railing']]){
  const m=add(new THREE.TorusGeometry(r,.065,8,112),rail,name,centerX,baseY+h,centerZ);
  m.rotation.x=Math.PI/2;m.castShadow=false;
 }
 // Distinct stone approach aligned with the public entrance.
 const approach=add(new THREE.BoxGeometry(3.7,.14,6.6),pale,'entry approach from court to doors',
 centerX,baseY+.103,facadeFrontZ+7.0);
 approach.castShadow=false;
 // Reference image has a bronze bust ahead of the main glazing. We model
 // its granite pedestal only (a fabricated likeness would misrepresent Qian).
 add(new THREE.BoxGeometry(1.65,2.65,1.35),
   new THREE.MeshStandardMaterial({color:'#8a5a4e',roughness:.69}),
   'Qian Xuesen bust / measured likeness unavailable — pedestal only',
   centerX,baseY+1.35,facadeFrontZ+2.5);
 add(new THREE.BoxGeometry(1.8,.25,1.6),bronze,'bust pedestal cap',
 centerX,baseY+2.68,facadeFrontZ+2.5);
 group.userData={
  accuracy:'Historic photo-informed approximate ground-level relief only; not survey',
  reference:'https://news.xjtu.edu.cn/info/1079/52073.htm',
  referenceYear:2016,
  exteriorRoadAndTerrainUntouched:true,
  sculptureLikeness:'NOT reconstructed'
 };
 return group;
}
