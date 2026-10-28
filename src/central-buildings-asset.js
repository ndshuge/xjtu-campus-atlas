import * as THREE from 'three';
import {ownedArchitecture} from './building-asset-kit.js';
import {planCells,cellBoundary} from './library-asset-plan.js';
import {bounds} from './geo.js';

export const CENTRAL_IDS=[263625087,263625088,263625089];

// Photo-guided roof group; OSM polygons remain the source of plan and picking.
// Roof pitch, eaves, entrance canopy and storey heights are not surveyed.
export function createCentralBuildingsAsset({buildings,baseY=1.1,uniforms={},stage='material'}={}){
 const b=ownedArchitecture('Historic central buildings / single owned group',{baseY,uniforms,stage});
 if(!b.gray){
  b.materials.stone.color.set('#bdbab0');b.materials.glass.color.set('#536973');b.materials.roof.color.set('#b96855');
  b.materials.roof.onBeforeCompile=s=>{
   s.vertexShader='varying vec3 vCentralRoof;\n'+s.vertexShader;
   s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvCentralRoof=(modelMatrix*vec4(transformed,1.)).xyz;');
   s.fragmentShader='varying vec3 vCentralRoof;\n'+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    vec2 tile=fract(vCentralRoof.xz*1.7);vec2 aa=max(fwidth(vCentralRoof.xz*1.7),vec2(.002));
    vec2 joint=smoothstep(vec2(.02)-aa,vec2(.02)+aa,min(tile,1.-tile));diffuseColor.rgb*=.94+.06*min(joint.x,joint.y);`);
  };b.materials.roof.customProgramCacheKey=()=> 'central-red-tile-1';
 }
 const tri=(kind,ps,index,height)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(ps.flat(),3));g.computeVertexNormals();b.add(kind,g,index,height);};
 const roof=(x0,z0,x1,z1,along,wall,peak,index,height,hip=true)=>{
  const e=baseY+wall,r=baseY+peak;
  if(along==='x'){
   const z=(z0+z1)/2,inset=hip?Math.min((z1-z0)/2,(x1-x0)*.24):0,l=x0+inset,h=x1-inset;
   b.quad('roof',[[x0,e,z0],[l,r,z],[h,r,z],[x1,e,z0]],index,height);
   b.quad('roof',[[l,r,z],[x0,e,z1],[x1,e,z1],[h,r,z]],index,height);
   tri(hip?'roof':'stone',[[x0,e,z0],[x0,e,z1],[l,r,z]],index,height);
   tri(hip?'roof':'stone',[[x1,e,z0],[h,r,z],[x1,e,z1]],index,height);
  }else{
   const x=(x0+x1)/2,inset=hip?Math.min((x1-x0)/2,(z1-z0)*.24):0,l=z0+inset,h=z1-inset;
   b.quad('roof',[[x0,e,z0],[x0,e,z1],[x,r,h],[x,r,l]],index,height);
   b.quad('roof',[[x,r,l],[x,r,h],[x1,e,z1],[x1,e,z0]],index,height);
   tri(hip?'roof':'stone',[[x0,e,z0],[x,r,l],[x1,e,z0]],index,height);
   tri(hip?'roof':'stone',[[x0,e,z1],[x1,e,z1],[x,r,h]],index,height);
  }
 };
 for(const id of CENTRAL_IDS){
  const building=buildings.find(x=>x.osmId===id);if(!building)continue;
  const index=buildings.indexOf(building),p=building.points,bb=bounds(p),height=building.height,wall=height-2.1;
  for(const edge of cellBoundary(planCells(p)))b.wall(edge,{top:wall,rows:4,index,height,bayWidth:3.7});
  if(id===263625088){
   const zNorth=(p[0][1]+p[1][1])/2,zSouth=(p[6][1]+p[14][1])/2;
   roof(bb[0],zNorth,bb[2],zSouth,'x',wall,height,index,height);
   roof(p[2][0],p[2][1],p[3][0],zNorth,'z',wall,height,index,height,false);
   roof(p[12][0],zSouth,p[9][0],p[10][1],'z',wall,height,index,height);
   if(!b.gray){
    // The four-column portico is visible in the school photograph; dimensions are approximate.
    const cx=(p[2][0]+p[3][0])/2,z=p[2][1]-.45;
    b.box('stone',cx,4.5,z,13,.55,2.2,index,height);
    // Keep the column face within the existing 0.65 m walk-collision margin.
    for(const dx of [-5,-1.7,1.7,5]){const g=new THREE.CylinderGeometry(.28,.32,4.5,10);g.translate(cx+dx,baseY+2.25,p[2][1]-.24);b.add('stone',g,index,height);}
   }
  }else if(id===263625087){
   roof(p[2][0],bb[1],p[6][0],bb[3],'z',wall,height,index,height);
   roof(bb[0],p[0][1],p[2][0],p[1][1],'x',wall,height,index,height);
   roof(bb[0],p[4][1],p[2][0],bb[3],'x',wall,height,index,height);
  }else{
   roof(bb[0],bb[1],p[4][0],bb[3],'z',wall,height,index,height);
   roof(p[4][0],bb[1],bb[2],p[6][1],'x',wall,height,index,height);
   roof(p[4][0],p[4][1],bb[2],bb[3],'x',wall,height,index,height);
  }
 }
 const asset=b.finish({owner:'central-buildings-asset.js',osmIds:CENTRAL_IDS,sourceDataUnchanged:true,estimated:true,
  evidence:'DESIGN_SOURCES.md',unknown:'Roof pitches, exact levels of side buildings, entrance dimensions and elevations are approximate'});
 // Window jambs are invisible at campus scale. Preserve them near the building,
 // but skip their draw call and shadow contribution in distant overviews.
 const jamb=asset.children.find(m=>m.name.endsWith(' / dark'));
 if(jamb){
  jamb.castShadow=false;
  const central=buildings.find(x=>x.osmId===263625088),center=new THREE.Vector3(central.center[0],baseY+central.height*.5,central.center[1]);
  asset.userData.detailLOD={level:'near',description:'window jambs only',near:750,far:850};
  asset.updateDetailLOD=camera=>{
   const distance=camera.position.distanceTo(center),near=jamb.visible?distance<850:distance<750;
   jamb.visible=near;asset.userData.detailLOD.level=near?'near':'far';
  };
 }
 return asset;
}
