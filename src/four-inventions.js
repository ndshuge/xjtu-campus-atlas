import * as THREE from 'three';

// Photo-informed book-like metal sculpture: schematic, not surveyed geometry.
export function createFourInventionsMarker(position){
 const [x,z]=position,group=new THREE.Group();
 group.name='Four Inventions Square: indicative book sculpture';
 const stone=new THREE.MeshStandardMaterial({color:'#a5aaa3',roughness:.88});
 const metal=new THREE.MeshStandardMaterial({color:'#38494c',metalness:.62,roughness:.36});
 const add=(geo,mat,name)=>{
  const mesh=new THREE.Mesh(geo,mat);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
 };
 const pedestal=add(new THREE.CylinderGeometry(4.7,4.9,.45,8),stone,'stone plinth');
 pedestal.position.set(x,1.34,z);
 // Paired curved steel pages made of 10 thick ribs, visible from different angles.
 for(const side of [-1,1])for(let rib=0;rib<5;rib++){
  const pts=[];
  for(let j=0;j<=24;j++){
   const t=j/24;
   pts.push(new THREE.Vector3(
    x+side*(.24+(5.2-rib*.2)*t),
    1.65+(6.0-rib*.23)*Math.sin(t*Math.PI*.82),
    z-2.3+4.6*t+(rib-2)*.23
   ));
  }
  const curve=new THREE.CatmullRomCurve3(pts);
  add(new THREE.TubeGeometry(curve,48,.18,8,false),metal,'curved metal leaf '+side+' '+rib);
 }
 const spine=add(new THREE.CylinderGeometry(.36,.48,1.1,10),metal,'shared book spine');
 spine.position.set(x,2,z-2.25);
 group.userData={confidence:'schematic sculptural silhouette',source:'https://news.xjtu.edu.cn/info/1021/118694.htm',positionBasis:'interpreted center, not surveyed',notForNavigation:true};
 return group;
}