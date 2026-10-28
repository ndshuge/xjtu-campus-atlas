import * as THREE from 'three';
import {ownedArchitecture} from './building-asset-kit.js';
import {labelTexture} from './architecture-kit.js';
import {planCells,cellBoundary} from './library-asset-plan.js';

export const RELOCATION_MUSEUM_ID=1167525875;

// The current school photograph supports a taller panel-clad volume and a low
// entrance wing. Their split, the west-facing placement and elevations are
// approximate: OSM supplies the unchanged footprint, not architectural plans.
export function createRelocationMuseumAsset({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 const p=building.points.slice(0,4),mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
 const t=.58,cutEast=mix(p[1],p[2],t),cutWest=mix(p[0],p[3],t);
 const high=[p[0],p[1],cutEast,cutWest,p[0]],low=[cutWest,cutEast,p[2],p[3],cutWest];
 const height=building.height,wingHeight=height*.52,cutZ=(cutEast[1]+cutWest[1])/2;
 const b=ownedArchitecture('Westward relocation museum / single owned exterior',{baseY,uniforms,stage});
 if(!b.gray){b.materials.stone.color.set('#d5d1c6');b.materials.roof.color.set('#aaa9a1');b.materials.glass.color.set('#263b44');b.materials.frame.color.set('#4d5a60');b.materials.dark.color.set('#303f47');}
 const makeZone=(polygon,top,which)=>{
  const cells=planCells(polygon),edges=cellBoundary(cells);b.roof(cells,top,buildingIndex,height);
  const front=edges.find(e=>e.nx<-.9);
  if(!front)throw Error('Museum west facade edge missing');
  for(const e of edges){
   if(e===front)continue;
   const mid=(e.a[1]+e.b[1])/2;if(Math.abs(e.nz)>.9&&Math.abs(mid-cutZ)<1){if(which==='main')b.plane('stone',e,0,e.length,wingHeight,top,buildingIndex,height);continue;}
   b.plane('stone',e,0,e.length,0,top,buildingIndex,height);
  }
  if(b.gray){b.plane('stone',front,0,front.length,0,top,buildingIndex,height);return front;}
  const L=front.length;
  b.plane('dark',front,0,L,0,top,buildingIndex,height,-.12);
  if(which==='main'){
   // The dark vertical slots belong to the facade beneath large light panels.
   for(let i=0;i<=25;i++){const s=L*i/25;b.plane('frame',front,Math.max(0,s-.045),Math.min(L,s+.045),0,top,buildingIndex,height,-.07);}
   for(const [a,c,lo,hi] of [[.01,.31,.53,.99],[.33,.64,.53,.99],[.66,.99,.12,.99],[.01,.27,.14,.47],[.30,.64,.18,.45]])
    b.plane('stone',front,L*a,L*c,top*lo,top*hi,buildingIndex,height,.06);
  }else{
   b.plane('stone',front,0,L,top*.61,top,buildingIndex,height,.06);
   b.plane('stone',front,0,L*.15,0,top*.61,buildingIndex,height,.06);
   b.plane('stone',front,L*.80,L,0,top*.61,buildingIndex,height,.06);
   b.plane('glass',front,L*.15,L*.80,.05,top*.61,buildingIndex,height,-.05);
   for(let i=0;i<=7;i++){const s=L*(.15+.65*i/7);b.plane('frame',front,s-.04,s+.04,.05,top*.61,buildingIndex,height,.01);}
   b.plane('frame',front,L*.15,L*.80,top*.32,top*.33,buildingIndex,height,.01);
  }
  return front;
 };
 makeZone(high,height,'main');const front=makeZone(low,wingHeight,'wing');
 const asset=b.finish({owner:'relocation-museum-asset.js',osmIds:[RELOCATION_MUSEUM_ID],sourceDataUnchanged:true,estimated:true,
  evidence:'DESIGN_SOURCES.md',unknown:'Facade orientation, wing split, elevations, rear and roof are approximate; entry renovation date is not established'});
 if(!b.gray){
  const map=labelTexture('交大西迁博物馆',{background:'rgba(0,0,0,0)',color:'#8e5536'});
  if(map){const sign=new THREE.Mesh(new THREE.PlaneGeometry(front.length*.60,1.05),new THREE.MeshStandardMaterial({map,transparent:true,depthWrite:false,roughness:.9}));
   const s=front.length*.48;sign.position.set(front.a[0]+front.ux*s+front.nx*.12,baseY+wingHeight*.78,front.a[1]+front.uz*s+front.nz*.12);sign.rotation.y=Math.atan2(front.nx,front.nz);sign.userData.place=building;sign.userData.buildingIndex=buildingIndex;asset.add(sign);
   const dispose=asset.dispose;let done=false;asset.dispose=()=>{if(done)return;done=true;dispose();map.dispose();};
  }
 }
 return asset;
}
