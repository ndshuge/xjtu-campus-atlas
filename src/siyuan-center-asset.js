import * as THREE from 'three';
import {ownedArchitecture} from './building-asset-kit.js';
import {labelTexture} from './architecture-kit.js';
import {planCells,cellBoundary} from './library-asset-plan.js';
import {bounds} from './geo.js';

export const SIYUAN_ID=263624056;
// Photo-guided exterior with the original OSM outline and unsurveyed 16 m height.
// Rear elevations, roof details and exact entrance/ground dimensions are unknown.
export function createSiyuanCenterAsset({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 const height=building.height,bb=bounds(building.points),[x0,z0,x1,z1]=bb,cx=(x0+x1)/2,w=x1-x0;
 const b=ownedArchitecture('Siyuan student centre / single owned exterior',{baseY,uniforms,stage,
  extraMaterials:{column:new THREE.MeshStandardMaterial({color:'#ab7c50',roughness:.78})}});
 if(!b.gray){b.materials.stone.color.set('#d5cbb8');b.materials.roof.color.set('#aaa99d');b.materials.glass.color.set('#294654');b.materials.frame.color.set('#929a94');}
 const cells=planCells(building.points),edges=cellBoundary(cells),front=edges.find(e=>e.nz>.9);
 if(!front)throw Error('Siyuan south facade edge missing');
 for(const e of edges){
  if(e===front)continue;
  if(b.gray||Math.abs(e.nx)<.9){b.plane('stone',e,0,e.length,0,height-.12,buildingIndex,height);continue;}
  // The visible corner is dark glazed; the long rear-side treatment remains a simple estimate.
  const atSouth=e.a[1]>e.b[1],corner=Math.min(7,e.length*.12),a=atSouth?0:e.length-corner,c=atSouth?corner:e.length;
  b.plane('stone',e,0,a,0,height-.12,buildingIndex,height);b.plane('stone',e,c,e.length,0,height-.12,buildingIndex,height);
  b.plane('glass',e,a,c,0,9.5,buildingIndex,height,-.08);b.plane('stone',e,a,c,9.5,height-.12,buildingIndex,height);
 }
 b.roof(cells,height-.12,buildingIndex,height);
 const L=front.length;
 if(b.gray)b.plane('stone',front,0,L,0,height-.12,buildingIndex,height);
 else{
  b.plane('glass',front,L*.07,L*.93,0,8.1,buildingIndex,height,-.28);
  // Sparse mullions follow the visible glazed entrance; their spacing is approximate.
  for(let i=0;i<=14;i++){const s=L*(.07+.86*i/14);b.plane('frame',front,s-.035,s+.035,.1,7.9,buildingIndex,height,-.21);}
  for(const y of [2.8,5.3])b.plane('frame',front,L*.07,L*.93,y-.035,y+.035,buildingIndex,height,-.21);
  b.plane('stone',front,0,L*.07,0,11.25,buildingIndex,height);b.plane('stone',front,L*.93,L,0,11.25,buildingIndex,height);
  // A recessed entrance beneath a stepped, pale fascia, as visible in both school photographs.
  for(const [a,c,bottom] of [[.07,.23,5.4],[.23,.33,6.6],[.33,.67,7.8],[.67,.77,6.6],[.77,.93,5.4]])b.plane('stone',front,L*a,L*c,bottom,11.25,buildingIndex,height,.08);
  b.plane('dark',front,L*.025,L*.975,11.25,13.45,buildingIndex,height,-.12);
  const at=(s,y,o=.03)=>[front.a[0]+front.ux*s+front.nx*o,baseY+y,front.a[1]+front.uz*s+front.nz*o];
  const beam=(s0,y0,s1,y1)=>{const ds=s1-s0,dy=y1-y0,n=Math.hypot(ds,dy),ns=-dy/n*.07,ny=ds/n*.07;b.quad('frame',[at(s0-ns,y0-ny),at(s0+ns,y0+ny),at(s1+ns,y1+ny),at(s1-ns,y1-ny)],buildingIndex,height);};
  const left=L*.035,right=L*.965,panels=22;
  for(let i=0;i<panels;i++){const a=left+i*(right-left)/panels,c=left+(i+1)*(right-left)/panels;beam(a,11.42,c,13.28);beam(a,13.28,c,11.42);}
  for(const fraction of [.245,.755]){
   // Keep the eye-height face within the footprint's walk-collision margin.
   const x=front.a[0]+front.ux*L*fraction-front.nx*.05,z=front.a[1]+front.uz*L*fraction-front.nz*.05;
   const col=new THREE.CylinderGeometry(.55,.63,6.9,12);col.translate(x,baseY+3.45,z);b.add('column',col,buildingIndex,height);
  }
  // Door frames indicate the photo-visible entrance; exact door dimensions are unsurveyed.
  for(const fraction of [.365,.435,.505,.575,.645]){
   const mid=L*fraction,half=L*.025;
   b.plane('frame',front,mid-half,mid-half+.09,.15,2.65,buildingIndex,height,-.21);
   b.plane('frame',front,mid+half-.09,mid+half,.15,2.65,buildingIndex,height,-.21);
   b.plane('frame',front,mid-half,mid+half,2.58,2.67,buildingIndex,height,-.21);
  }
  for(let i=0;i<4;i++)b.box('stone',cx,0,z1+.5+i*.48,w*.60,.52-i*.1,.53,buildingIndex,height);
 }
 // Eave projection is a visual estimate; footprint and OSM data are untouched.
 b.box('stone',cx,height-2.55,z1+.45,w+3,2.55,4.2,buildingIndex,height);
 const asset=b.finish({owner:'siyuan-center-asset.js',osmIds:[SIYUAN_ID],sourceDataUnchanged:true,estimated:true,
  evidence:'DESIGN_SOURCES.md',unknown:'Rear/side elevations, roof sections, exact heights, canopy and ground datum are unsurveyed'});
 if(!b.gray){
  const map=labelTexture('思源学生活动中心',{background:'rgba(0,0,0,0)',color:'#353932'});
  if(map){const sign=new THREE.Mesh(new THREE.PlaneGeometry(24,1.25),new THREE.MeshStandardMaterial({map,transparent:true,depthWrite:false,roughness:.9}));
   const mid=L*.5;sign.position.set(front.a[0]+front.ux*mid+front.nx*.13,baseY+9.45,front.a[1]+front.uz*mid+front.nz*.13);sign.rotation.y=Math.atan2(front.nx,front.nz);sign.userData.place=building;sign.userData.buildingIndex=buildingIndex;asset.add(sign);
   const dispose=asset.dispose;let done=false;asset.dispose=()=>{if(done)return;done=true;dispose();map.dispose();};
  }
 }
 return asset;
}
