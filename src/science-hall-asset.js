import * as THREE from 'three';
import {toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';
import {ownedArchitecture} from './building-asset-kit.js';
import {planCells,cellBoundary,clipCell,signedArea} from './library-asset-plan.js';
import {pointSegment,bounds,extrude} from './geo.js';
import {createScienceRoofFrame} from './cultural-facades.js';

export const SCIENCE_ID=263632364;
export const SCIENCE_HEIGHTS=Object.freeze({main:21,annexEave:7.2,annexRise:4.4,link:6.4});
export function scienceHallPlan(building){
 if(building?.osmId!==SCIENCE_ID||building.holes.length)throw Error('Unreviewed science hall source');
 const points=building.points.map(p=>p.slice()),first=points.findIndex(p=>Math.hypot(p[0]-64.684,p[1]+24.093)<.02);
 if(first<0||Math.hypot(points[first+1][0]-63.892,points[first+1][1]-.022)>.02)throw Error('Science entry seams changed; review photos');
 // This small fold is the R9 photo-supported west curtain line, not a map edit.
 points.splice(first+1,0,[63.1,-12.0355]);
 const zones=[
  {id:'main-west-entry',height:21,rows:5,cells:planCells(points,[-1e4,-40.965,1e4,1e4])},
  {id:'recessed-low-link',height:6.4,rows:1,cells:planCells(building.points,[-1e4,-56.3,1e4,-40.965])},
  {id:'north-pitched-annex',height:7.2,rows:2,cells:planCells(building.points,[-1e4,-1e4,1e4,-56.3]),pitched:true}
 ];
 return {zones,sourceArea:Math.abs(signedArea(building.points)),area:zones.reduce((n,z)=>n+z.cells.reduce((s,p)=>s+Math.abs(signedArea(p)),0),0),
  heights:SCIENCE_HEIGHTS,accuracy:'Main 21m estimate retained; low-link/annex/roof elevations and facade panel cadence are photo estimates, not surveyed storeys',
  evidence:['2019-07-15 official west photo (EXIF clock unverified)','2025-07-25 Commons aerial (north annex only; main body outside frame)']};
}
export function createScienceHallAsset({building,buildingIndex=-1,baseY=1.1,uniforms={},stage='material'}={}){
 const plan=scienceHallPlan(building),b=ownedArchitecture('Yifu Science Hall / complete owned main, low link and pitched annex',{baseY,uniforms,stage}),index=buildingIndex,height=21;
 if(!b.gray){b.materials.stone.color.set('#bd9e79');b.materials.glass.color.set('#2c7d9e');b.materials.glass.roughness=.24;b.materials.glass.metalness=.18;}
 let folds=0;
 for(const zone of plan.zones){
  const edges=cellBoundary(zone.cells);
  for(const e of edges){
   const mx=(e.a[0]+e.b[0])/2,mz=(e.a[1]+e.b[1])/2;
   if(zone.id==='main-west-entry'&&e.nx<-.7&&mx>62&&mx<65&&mz>-24.2&&mz<.2){
    b.curtain(e,{bottom:.15,top:20.65,index,height,columns:5,rows:6});b.plane('stone',e,0,e.length,20.65,21,index,height);folds++;
   }else if(zone.id==='main-west-entry'&&e.nx<-.35&&mx<64&&((mz>=-41&&mz<-24)||(mz>0&&mz<11))){
    const center=e.length*.32,a=Math.max(0,center-.95),c=Math.min(e.length,center+.95);
    b.plane('stone',e,0,a,0,21,index,height);b.plane('stone',e,c,e.length,0,21,index,height);b.plane('stone',e,a,c,0,1.1,index,height);
    b.curtain(e,{from:a,to:c,bottom:1.1,top:20.4,index,height,columns:1,rows:6});b.plane('stone',e,a,c,20.4,21,index,height);
   }else b.wall(e,{top:zone.height,rows:zone.rows,index,height});
  }
  if(!zone.pitched)b.roof(zone.cells,zone.height,index,height);
  else {
   // The licensed 2025 aerial reveals the northern annex's dark hipped roof.
   // Use its mapped envelope; exact ridge/skylight lines remain unmeasured.
   const bb=bounds(zone.cells.flat()),positions=[],roofHeight=p=>zone.height+Math.min(SCIENCE_HEIGHTS.annexRise,Math.min(...edges.map(e=>pointSegment(p,e.a,e.b).distance))*.28);
   for(let x=bb[0];x<bb[2];x+=3.5)for(let z=bb[1];z<bb[3];z+=3.5)for(const ps of zone.cells.map(c=>clipCell(c,[x,z,Math.min(x+3.5,bb[2]),Math.min(z+3.5,bb[3])])).filter(p=>p.length>2))
    for(let i=1;i<ps.length-1;i++)for(const p of [ps[0],ps[i+1],ps[i]])positions.push(p[0],baseY+roofHeight(p),p[1]);
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.computeVertexNormals();b.add('dark',toCreasedNormals(g,Math.PI/7),index,height);
  }
 }
 if(folds!==2)throw Error('Science folded west glazing did not replace exactly two edges');
 const centerZ=-12.0355,frontX=63.7,canopy=[];
 for(let i=0;i<=32;i++){const a=-Math.PI/2+i*Math.PI/32;canopy.push([frontX-5.3*Math.cos(a),centerZ+14*Math.sin(a)]);}canopy.push(canopy[0]);
 b.add('stone',extrude(canopy,1.35,baseY+4.8),index,height);
 for(const s of [-1,1])b.box('stone',frontX-.6,0,centerZ+s*13.1,1.4,4.8,1.8,index,height);
 // Reuse the documented, connected R9 roof frame, without retaining its old
 // facade/canopy or the generic full-height north volume behind the new asset.
 const legacy=createScienceRoofFrame({height,baseY}),frame=legacy.children.find(m=>m.name.endsWith('/ frame')),ps=[],ns=[],uv=[];
 const p=frame.geometry.attributes.position,n=frame.geometry.attributes.normal,t=frame.geometry.attributes.uv;
 for(let i=0;i<p.count;i+=3){if((p.getY(i)+p.getY(i+1)+p.getY(i+2))/3<baseY+20.65)continue;for(let j=i;j<i+3;j++){ps.push(p.getX(j),p.getY(j),p.getZ(j));ns.push(n.getX(j),n.getY(j),n.getZ(j));uv.push(t.getX(j),t.getY(j));}}
 const roofFrame=new THREE.BufferGeometry();roofFrame.setAttribute('position',new THREE.Float32BufferAttribute(ps,3));roofFrame.setAttribute('normal',new THREE.Float32BufferAttribute(ns,3));roofFrame.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));b.add('frame',roofFrame,index,height);
 const mats=new Set();legacy.traverse(m=>{if(m.isMesh){m.geometry.dispose();mats.add(m.material);}});for(const m of mats)m.dispose();
 return b.finish({owner:'science-hall-asset.js',osmIds:[SCIENCE_ID],plan,foldedCurtainEdges:folds,roofFrameReused:true,roofFrameTriangles:ps.length/9,
  retiredVisuals:['generic buildingMesh science','scienceHallFacade','scienceHall silhouette overlay'],dataId:building.id,
  unverified:'Exact annex height, roof ridgelines/skylight, floor count, rear elevation and current 2026 condition'});
}
