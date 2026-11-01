import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {planCells,cellBoundary} from '../../library-asset-plan.js';
export const ADMISSIONS_OFFICE_ID=264738603;
export const ADMISSIONS_PHOTO='https://www.xjtu.edu.cn/info/1055/5493.htm';

function makeSignTexture(){
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=2048;c.height=256;
 const ctx=c.getContext('2d');ctx.fillStyle='#c4c8c7';ctx.fillRect(0,0,c.width,c.height);
 ctx.strokeStyle='#1763a6';ctx.lineWidth=8;ctx.beginPath();ctx.arc(112,120,65,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle='#1763a6';ctx.textAlign='center';ctx.font='bold 34px sans-serif';ctx.fillText('西交大',112,132);
 ctx.textAlign='left';ctx.font='bold 76px "Microsoft YaHei",sans-serif';
 ctx.fillText('西安交通大学  招生办公室',228,114,1710);
 ctx.font='48px Arial,sans-serif';ctx.fillText("XI'AN JIAOTONG UNIVERSITY · Admissions Office",228,190,1710);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
export function createAdmissionsOfficeAsset({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 if(building?.osmId!==ADMISSIONS_OFFICE_ID)throw Error('Expected OSM 264738603');
 if(!Number.isInteger(buildingIndex)||buildingIndex<0)throw Error('Invalid building index');
 const cells=planCells(building.points),edges=cellBoundary(cells);
 const front=edges.filter(e=>e.length>20).sort((a,b)=>(a.a[1]+a.b[1])-(b.a[1]+b.b[1]))[0];
 if(!front)throw Error('North facade not resolved');
 const h=building.height,L=front.length,index=buildingIndex;
 const b=ownedArchitecture('Admissions office photo-informed facade',{baseY,uniforms,stage,
  extraMaterials:{sign:new THREE.MeshStandardMaterial({color:'#c1c5c4',roughness:.85})}});
 if(!b.gray){
  b.materials.stone.color.set('#c2c5c4');b.materials.glass.color.set('#557183');
  b.materials.frame.color.set('#939b9d');b.materials.dark.color.set('#45545a');
  b.materials.roof.color.set('#9b9e9b');
 }
 for(const e of edges)if(e!==front)b.plane('stone',e,0,e.length,0,h,index,h);
 // Height/roof/placement remain estimates; unphotographed sides stay undecorated.
 b.plane('stone',front,0,L,7.4,h,index,h);
 b.plane('stone',front,0,L*.31,4.75,7.4,index,h);
 b.plane('stone',front,L*.72,L,4.75,7.4,index,h);
 b.plane('glass',front,L*.31,L*.72,4.75,7.4,index,h,.06);
 for(const t of [.31,.39,.47,.55,.63,.72])b.plane('frame',front,L*t-.048,L*t+.048,4.75,7.4,index,h,.09);
 b.plane('frame',front,L*.31,L*.72,6.05,6.13,index,h,.09);
 b.plane('stone',front,0,L,3.2,4.75,index,h);
 b.plane('sign',front,L*.34,L*.69,3.4,4.45,index,h,.08);
 // Front edge runs westward: photo shows the door left of the small window.
 const d0=.52,d1=.67,w0=.38,w1=.48;
 for(const [a,c] of [[0,w0],[w1,d0],[d1,1]])b.plane('stone',front,L*a,L*c,0,3.2,index,h);
 b.plane('glass',front,L*d0,L*d1,.12,2.9,index,h,.08);
 b.plane('glass',front,L*w0,L*w1,1.12,2.7,index,h,.08);
 b.plane('stone',front,L*d0,L*d1,2.9,3.2,index,h);
 b.plane('stone',front,L*w0,L*w1,0,1.12,index,h);
 b.plane('stone',front,L*w0,L*w1,2.7,3.2,index,h);
 for(const [x,low,top] of [[d0,.12,2.9],[d1,.12,2.9],[w0,1.12,2.7],[w1,1.12,2.7]])
  b.plane('frame',front,L*x-.035,L*x+.035,low,top,index,h,.12);
 b.plane('frame',front,L*(d0+d1)/2-.035,L*(d0+d1)/2+.035,.12,2.9,index,h,.12);
 b.plane('frame',front,L*d0,L*d1,2.85,2.93,index,h,.12);
 b.roof(cells,h,index,h);
 const asset=b.finish({owner:'src/assets/south/admissions-office-asset.js',
  osmIds:[ADMISSIONS_OFFICE_ID],photoSource:ADMISSIONS_PHOTO,
  photoLicense:'school-owned-reference-only',photoDate:'unconfirmed',
  heightStatus:'unmeasured-osm-estimate',frontOrientationStatus:'provisional-north-edge',
  roofStatus:'unknown-flat-placeholder',confirmedFeatures:['blue-bilingual-sign','metal-framed-glass-door','upper-glazing','grey-wall','adjacent-window'],
  sourceDataUnchanged:true,geometryStatus:'photo-informed front; other elevations schematic',
  front:{center:[front.a[0]+front.ux*L*.5,baseY+3.8,front.a[1]+front.uz*L*.5],
   normal:[front.nx,front.nz],tangent:[front.ux,front.uz]}});
 const tex=stage==='massing'?null:makeSignTexture();
 if(tex){
  const g=new THREE.PlaneGeometry(L*.345,.88);
  const material=new THREE.MeshBasicMaterial({map:tex,depthWrite:false});
  const m=new THREE.Mesh(g,material);
  const t=.515;m.position.set(front.a[0]+front.ux*L*t+front.nx*.13,baseY+3.95,front.a[1]+front.uz*L*t+front.nz*.13);
  m.rotation.y=Math.atan2(front.nx,front.nz);
  g.setAttribute('buildingIndex',new THREE.Float32BufferAttribute(new Array(g.attributes.position.count).fill(index),1));
  m.userData.buildingAssetMesh=true;asset.add(m);
  const dispose=asset.dispose;asset.dispose=()=>{dispose();g.dispose();material.dispose();tex.dispose();};
 }
 return asset;
}