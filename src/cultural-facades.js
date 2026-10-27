import * as THREE from 'three';
import {architectureBatch,stoneMaterial,glassMaterial,labelTexture} from './architecture-kit.js';
import {boxGeometry,extrude} from './geo.js';
import {onFacade} from './building-envelope.js';

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
 // Existing OSM 263632364 west entrance seams. The slight central fold and
 // canopy depth below are visual interpretations, not additional map survey.
 const ends=[[64.684,-24.093],[63.892,.022]],centerZ=(ends[0][1]+ends[1][1])/2;
 const fold=[63.10,centerZ],frontX=63.7;
 const mats={stone:stoneMaterial('#bd9f79',1.3),glass:glassMaterial('#267fa8'),frame:new THREE.MeshStandardMaterial({color:'#7a8179',roughness:.46,metalness:.32})};
 const b=architectureBatch('Yifu Science Hall / folded west glazing and curved portico',mats);
 const edge=(a,c)=>{const dx=c[0]-a[0],dz=c[1]-a[1],length=Math.hypot(dx,dz);return{a,c,length,nx:-dz/length,nz:dx/length,angle:-Math.atan2(dz,dx)};};
 for(const e of [edge(ends[0],fold),edge(fold,ends[1])]){
  onFacade(b,'glass',e,{y:baseY+3.5,width:e.length,height:height-3.9,depth:.18,offset:.25});
  for(let i=0;i<=5;i++)onFacade(b,'frame',e,{along:i/5,y:baseY+3.5,width:.11,height:height-3.9,depth:.20,offset:.42});
  for(let y=6;y<height-.5;y+=3.3)onFacade(b,'frame',e,{y:baseY+y,width:e.length,height:.12,depth:.20,offset:.42});
 }
 const wings=[edge([49.365,-40.965],ends[0]),edge(ends[1],[48.886,10.893])];
 for(const e of wings){
  onFacade(b,'stone',e,{y:baseY,width:e.length,height,depth:.18,offset:.19});
  onFacade(b,'glass',e,{along:.32,y:baseY+1.1,width:1.8,height:height-2.2,depth:.16,offset:.38});
 }
 const canopy=[];
 for(let i=0;i<=32;i++){const a=-Math.PI/2+i/32*Math.PI;canopy.push([frontX-5.3*Math.cos(a),centerZ+14*Math.sin(a)]);}
 canopy.push(canopy[0]);
 b.add('stone',extrude(canopy,1.35,baseY+4.8));
 // Photograph shows a sheltered entry at grade, not the old broad staircase.
 // Remove unsupported entrance steps without changing the ground datum.
 b.box('glass',63.25,baseY+.15,centerZ,.20,4.55,20);
 for(let i=-4;i<=4;i++)b.box('frame',63.08,baseY+.15,centerZ+i*2.4,.20,4.55,.11);
 for(const s of [-1,1])b.box('stone',frontX-.6,baseY,centerZ+s*13.1,1.4,4.8,1.8);
 const {corners,apex}=appendScienceRoofFrame(b,{height,baseY});
 const g=b.finish();g.userData={source:'https://wmw.xjtu.edu.cn/wh/dbcg1/2.htm',referenceDate:'EXIF DateTimeOriginal 2019-07-15 15:44:00; camera clock unverified',estimated:true,facadeOrientation:'west; existing OSM seam anchors',bounds:[x0,z0,x1,z1],curtainWallFolds:2,canopy:'curved D plan / approximate',roofFrame:{corners,apex,posts:4,connected:true},heightPolicy:'existing 21m estimate unchanged; canopy/fold/frame dimensions unsurveyed'};return g;
}

function appendScienceRoofFrame(b,{height,baseY}){
 const centerZ=-12.0355,roof=baseY+height,corners=[[63.2,centerZ-6.2],[73.2,centerZ-6.2],[73.2,centerZ+6.2],[63.2,centerZ+6.2]],apex=[68.2,roof+4.0,centerZ];
 for(let i=0;i<4;i++){
  const p=corners[i],q=corners[(i+1)%4],top=[p[0],roof+.9,p[1]];
  b.beam('frame',[p[0],roof-.2,p[1]],top,.16);
  b.beam('frame',top,[q[0],roof+.9,q[1]],.16);
  b.beam('frame',top,apex,.16);
 }
 return {corners,apex,posts:4,connected:true};
}

export function createScienceRoofFrame({height,baseY}){
 const b=architectureBatch('Yifu Science Hall / reused open roof frame',{frame:new THREE.MeshStandardMaterial({color:'#7a8179',roughness:.46,metalness:.32})});
 const roofFrame=appendScienceRoofFrame(b,{height,baseY}),g=b.finish();g.userData={roofFrame};return g;
}
