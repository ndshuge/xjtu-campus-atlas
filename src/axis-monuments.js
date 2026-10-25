import * as THREE from 'three';
import {architectureBatch,stoneMaterial,labelTexture} from './architecture-kit.js';
import {extrude,rectangle,BASE} from './geo.js';

// Profiles follow visible features in photographs. All dimensions are estimates.
function taperedColumn(levels,sides=4){
 const positions=[],indices=[];
 levels.forEach(([y,r])=>{for(let i=0;i<sides;i++){const a=i/sides*Math.PI*2+Math.PI/4;positions.push(Math.cos(a)*r,y,Math.sin(a)*r);}});
 for(let j=0;j<levels.length-1;j++)for(let i=0;i<sides;i++){const a=j*sides+i,b=j*sides+(i+1)%sides,c=b+sides,d=a+sides;indices.push(a,b,d,b,c,d);}
 for(let i=1;i<sides-1;i++)indices.push(0,i+1,i,(levels.length-1)*sides,(levels.length-1)*sides+i,(levels.length-1)*sides+i+1);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function createTengfeiTower(position){
 const [x,z]=position;
 const b=architectureBatch('Tengfei Tower / single tapered stone shaft',{
  stone:stoneMaterial('#bca58c'),base:stoneMaterial('#ae8579'),steel:new THREE.MeshStandardMaterial({color:'#c7cbcc',metalness:.78,roughness:.29}),dark:new THREE.MeshStandardMaterial({color:'#343b3b',roughness:.65})
 });
 for(let i=0;i<3;i++)b.box('base',x,BASE+i*.21,z,16-i*1.15,.23,12-i*.8);
 const shaft=taperedColumn([[BASE+.65,3.2],[BASE+4,2.7],[BASE+20,1.2],[BASE+27,.67]],4);shaft.translate(x,0,z);b.add('stone',shaft);
 // Silver split wings converge above a narrow open slot; no fictitious gold ring.
 for(const side of [-1,1]){
  const shape=new THREE.Shape();
  shape.moveTo(side*.37,25.2);shape.lineTo(side*1.1,28.9);shape.lineTo(side*.42,31.4);shape.lineTo(side*.10,34.2);shape.lineTo(side*.05,30.6);shape.lineTo(side*.38,28.4);shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth:.34,bevelEnabled:false});g.translate(x,BASE,z-.17);b.add('steel',g);
 }
 // Dark circular inset visible on the stone face; approximate relief only.
 const relief=new THREE.CylinderGeometry(.6,.6,.12,24);relief.rotateX(Math.PI/2);relief.translate(x,BASE+10.5,z-1.65);b.add('dark',relief);
 const group=b.finish();
 group.userData={surveyed:false,positionBasis:'OSM node 2692495837',reference:'https://commons.wikimedia.org/wiki/File:西交兴庆之腾飞塔.png',referenceDate:'2025-07-25',omitted:'The figurative statue is not recreated from insufficient multi-view detail.'};
 return group;
}

export function createSiyuanStele(position){
 const [x,z]=position;
 const b=architectureBatch('Yinshui Siyuan / photo-informed stele',{
  granite:stoneMaterial('#a66f64',1.6),bronze:new THREE.MeshStandardMaterial({color:'#384346',metalness:.55,roughness:.46}),inset:stoneMaterial('#d3cabb')
 });
 b.box('bronze',x,BASE,z,4.8,.45,4.2);
 b.box('granite',x,BASE+.45,z,3.3,3.5,3.0);
 const shoulder=new THREE.CylinderGeometry(1.35,2.20,.62,4);shoulder.rotateY(Math.PI/4);shoulder.translate(x,BASE+4.15,z);b.add('granite',shoulder);
 b.box('granite',x,BASE+4.45,z,1.9,3.1,1.5);
 b.box('bronze',x,BASE+4.45,z,2.07,.35,1.65);
 b.box('inset',x,BASE+4.99,z-.79,1.32,2.1,.10);
 b.box('granite',x,BASE+7.6,z,2.6,.48,2.2);
 // Gear, books, anvil and hammer are visible in the historic photograph.
 const ring=new THREE.TorusGeometry(1.75,.15,6,64);ring.translate(x,BASE+10,z);b.add('bronze',ring);
 for(let i=0;i<48;i++){
  const a=i/48*Math.PI*2,g=new THREE.BoxGeometry(.14,.27,.22);g.rotateZ(-a);g.translate(x+Math.sin(a)*1.88,BASE+10+Math.cos(a)*1.88,z);b.add('bronze',g);
 }
 for(let i=0;i<3;i++)b.box('bronze',x+(i-1)*.35,BASE+8.8,z,.30,1.7,.65);
 b.box('bronze',x,BASE+8.5,z,1.9,.48,.85);
 b.beam('bronze',[x-.85,BASE+8.5,z-.05],[x+.05,BASE+10.5,z-.05],.12);
 b.box('bronze',x+.1,BASE+10.1,z,.92,.35,.64);
 const group=b.finish(),texture=labelTexture('饮水思源',{width:256,height:768,background:'#d3cabb',vertical:true});
 if(texture){const plaque=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.95),new THREE.MeshStandardMaterial({map:texture,roughness:.9}));plaque.position.set(x,BASE+6.05,z-.86);plaque.rotation.y=Math.PI;group.add(plaque);}
 group.userData={surveyed:false,positionBasis:'Official campus plan and north-gate/central-building relative location; approximate',reference:'https://commons.wikimedia.org/wiki/File:XJTU_YSSY.JPG',referenceDate:'2011-04-06',pool:'No new pool is invented: its exact outline is not present in the OSM snapshot.'};
 return group;
}
