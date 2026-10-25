import * as THREE from 'three';
import {architectureBatch,stoneMaterial,glassMaterial,labelTexture} from './architecture-kit.js';
import {boxGeometry} from './geo.js';

// Both functions retain the OSM building as their selectable underlying volume.
// Visible features are photograph-informed; construction dimensions are inferred.
export function createSiyuanCenter({footprint,height,baseY}){
 const [x0,z0,x1,z1]=footprint,cx=(x0+x1)/2,w=x1-x0,front=z1+.16;
 const b=architectureBatch('Siyuan student centre / deep eave and exposed truss',{
  stone:stoneMaterial('#d8cdb6',2),glass:glassMaterial('#264f6b'),steel:new THREE.MeshStandardMaterial({color:'#737f7a',metalness:.48,roughness:.5}),column:stoneMaterial('#a98167'),steps:stoneMaterial('#b9b5aa')
 });
 b.box('glass',cx,baseY+.6,front,w*.91,10.0,.22);
 for(let i=0;i<=24;i++)b.box('steel',cx-w*.455+i*w*.91/24,baseY+.55,front+.16,.10,10.1,.20);
 for(let y=2.6;y<10;y+=2.55)b.box('steel',cx,baseY+y,front+.16,w*.91,.10,.20);
 // Stepped opening in the pale facade is expressed as separate flanking piers.
 for(const side of [-1,1]){
  b.box('stone',cx+side*w*.405,baseY+6.0,front+.36,w*.1,7.2,.9);
  b.box('stone',cx+side*w*.29,baseY+9.0,front+.36,w*.14,4.2,.9);
  const column=new THREE.CylinderGeometry(.58,.67,8.5,16);column.translate(cx+side*w*.255,baseY+4.4,front+1.05);b.add('column',column);
 }
 b.box('stone',cx,baseY+11.0,front+.37,w*.92,2.4,1.1);
 const trussY=baseY+13.15,roofY=baseY+15.45;
 b.box('steel',cx,trussY,front+.5,w*.97,.19,.35);
 b.box('steel',cx,roofY-.15,front+.5,w*.97,.19,.35);
 const span=w*.97,panels=22;
 for(let i=0;i<panels;i++){
  const x=cx-span/2+i*span/panels,nx=x+span/panels;
  b.beam('steel',[x,trussY,front+.5],[nx,roofY-.15,front+.5],.075);
  b.beam('steel',[x,roofY-.15,front+.5],[nx,trussY,front+.5],.075);
 }
 b.box('stone',cx,roofY,front-2,w+2,1.2,7.2);
 for(let i=0;i<9;i++)b.box('steps',cx,baseY,front+1.4+i*.78,w*.71,1.35-i*.13,.81);
 const g=b.finish(),sign=labelTexture('思源学生活动中心',{background:'#d8cdb6'});
 if(sign){const s=new THREE.Mesh(new THREE.PlaneGeometry(28,1.65),new THREE.MeshStandardMaterial({map:sign}));s.position.set(cx,baseY+12.15,front+1.0);g.add(s);}
 g.userData={reference:'https://commons.wikimedia.org/wiki/File:第14届挑战杯于西交思源活动中心.jpg',referenceDate:'2024-11-02',earlierReference:'2011-08-19',estimated:true};return g;
}

export function createScienceHall({footprint,height,baseY}){
 const [x0,z0,x1,z1]=footprint;
 // The photographed entrance faces WEST, towards the central square. Model in
 // a local front-facing frame, then rotate into the footprint's recessed edge.
 const w=49,frontX=63.6,centerZ=-15.0;
 const mats={stone:stoneMaterial('#b7a080'),glass:glassMaterial('#286c91'),frame:new THREE.MeshStandardMaterial({color:'#677b7c',roughness:.48,metalness:.32}),steps:stoneMaterial('#b4afa4')};
 const b=architectureBatch('Yifu Science Hall / west entrance',mats);
 const add=(kind,u,y,v,a,h,d)=>{
  const geo=boxGeometry(0,y,0,a,h,d);geo.rotateY(-Math.PI/2);geo.translate(frontX-v,0,centerZ+u);b.add(kind,geo);
 };
 add('glass',0,baseY+3.5,0,20,height-5,.28);
 for(let i=-4;i<=4;i++)add('frame',i*2.4,baseY+3.5,.18,.12,height-5,.20);
 for(let y=6;y<height-1;y+=2.6)add('frame',0,baseY+y,.18,20,.12,.20);
 // Narrow glazing slots in each mostly solid ochre wing.
 for(const side of [-1,1]){
  add('stone',side*17,baseY,.25,9.3,height,.8);
  add('glass',side*14.5,baseY+1.6,.72,2.2,height-3,.2);
 }
 add('stone',0,baseY+4.9,2.1,25,1.7,5.0);
 for(let i=-4;i<=4;i++)add('frame',i*2.4,baseY+.6,3.9,.12,4.3,.24);
 add('glass',0,baseY+.5,3.8,21.7,4.3,.24);
 for(let i=0;i<4;i++)add('steps',0,baseY,4.8+i*.72,28,.58-i*.12,.75);
 // Open triangular roof lantern, a distinctive photographed silhouette.
 const roof=baseY+height;
 for(const depth of [-3,3]){
  b.beam('frame',[frontX+depth,roof-1.0,centerZ-7],[frontX+depth,roof+3.6,centerZ],.14);
  b.beam('frame',[frontX+depth,roof+3.6,centerZ],[frontX+depth,roof-1.0,centerZ+7],.14);
 }
 b.beam('frame',[frontX-3,roof+3.6,centerZ],[frontX+3,roof+3.6,centerZ],.14);
 const g=b.finish();g.userData={source:'https://wmw.xjtu.edu.cn/wh/dbcg1/2.htm',referenceDate:'EXIF 2019-07-15; camera clock unverified',estimated:true,facadeOrientation:'west; inferred from footprint and square relationship',bounds:[x0,z0,x1,z1]};return g;
}
