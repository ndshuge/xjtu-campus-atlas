import * as THREE from 'three';
import {ownedArchitecture} from './building-asset-kit.js';
import {bounds} from './geo.js';
import {planCells,cellBoundary} from './library-asset-plan.js';
import {createMainERoofDetail} from './main-e-roof-detail.js';

export const MAIN_LOW_IDS=Object.freeze([264595812,3557330,3557331]);
export const MAIN_IDS=Object.freeze([263624057,263624058,263624059,263624060,263624061,...MAIN_LOW_IDS]);
// Round photo estimates, not a claim that the unacquired 107.45m drawing was read.
export const MAIN_HEIGHTS=Object.freeze({tower:100,wing:22,podium:5.4,portal:22});
export const mainDisplayHeight=id=>id===263624057?MAIN_HEIGHTS.tower:MAIN_LOW_IDS.includes(id)?MAIN_HEIGHTS.podium:MAIN_HEIGHTS.wing;
export function mainComplexPlan(buildings){
 return MAIN_IDS.map(id=>{const building=buildings.find(b=>b.osmId===id);if(!building)throw Error('Main complex missing OSM '+id);
  return {id,building,index:buildings.indexOf(building),height:mainDisplayHeight(id),
   rows:id===263624057?23:MAIN_LOW_IDS.includes(id)?1:4,role:id===263624057?'E tower':MAIN_LOW_IDS.includes(id)?'mapped low connection / terrace':'A-D teaching wing',accuracy:'photo-estimated height; original mapped outline; not surveyed'};
 });
}
export function createMainComplexAsset({buildings,baseY=1.1,uniforms={},stage='material'}={}){
 const parts=mainComplexPlan(buildings),b=ownedArchitecture('Main A-E / complete owned building group',{baseY,uniforms,stage});
 for(const part of parts){
  const {building,index,height,rows,id}=part;
  if(id!==263624057){b.shell(building.points,{top:height,rows,index});continue;}
  const bb=bounds(building.points),[x0,z0,x1,z1]=bb,cx=(x0+x1)/2,cz=(z0+z1)/2,w=x1-x0,d=z1-z0,body=height-MAIN_HEIGHTS.portal;
  const cells=planCells(building.points),edges=cellBoundary(cells),glassHalf=w*.235;
  for(const e of edges){
   const front=Math.abs(e.nz)>.9&&(Math.min(e.a[1],e.b[1])<z0+1||Math.max(e.a[1],e.b[1])>z1-1);
   if(!front){
    // Side photograph: long recessed glazing slots separated by continuous
    // pale piers, rather than twenty rows of generic punched square windows.
    const spans=[];
    for(let k=0;k<7;k++){const z=z0+4.3+k*(d-8.6)/6,r=[(z-1.2-e.a[1])/e.uz,(z+1.2-e.a[1])/e.uz].sort((a,b)=>a-b),a=Math.max(0,r[0]),c=Math.min(e.length,r[1]);if(c>a)spans.push([a,c]);}
    let cursor=0;
    for(const [a,c] of spans.sort((a,b)=>a[0]-b[0])){b.plane('stone',e,cursor,a,0,body,index,height);b.plane('stone',e,a,c,0,10,index,height);b.curtain(e,{from:a,to:c,bottom:10,top:body-1,index,height,columns:1,rows:18});b.plane('stone',e,a,c,body-1,body,index,height);cursor=c;}
    b.plane('stone',e,cursor,e.length,0,body,index,height);continue;
   }
   const range=[(cx-glassHalf-e.a[0])/e.ux,(cx+glassHalf-e.a[0])/e.ux].sort((a,b)=>a-b),lo=Math.max(0,range[0]),hi=Math.min(e.length,range[1]);
   const outer=(from,to)=>{
    if(to<=from)return;
    const intervals=[];
    for(const x of [x0+2.8,x1-2.8]){const r=[(x-1.1-e.a[0])/e.ux,(x+1.1-e.a[0])/e.ux].sort((a,b)=>a-b),a=Math.max(from,r[0]),c=Math.min(to,r[1]);if(c>a)intervals.push([a,c]);}
    let cursor=from;
    for(const [a,c] of intervals.sort((a,b)=>a[0]-b[0])){b.plane('stone',e,cursor,a,0,body,index,height);b.plane('stone',e,a,c,0,10,index,height);b.curtain(e,{from:a,to:c,bottom:10,top:body,index,height,columns:1,rows:18});cursor=c;}
    b.plane('stone',e,cursor,to,0,body,index,height);
   };
   if(hi<=lo){outer(0,e.length);continue;}
   outer(0,lo);outer(hi,e.length);
   b.curtain(e,{from:lo,to:hi,bottom:12,top:body-1,index,height,columns:Math.max(1,Math.round((hi-lo)/3)),rows:18});
   if(!b.gray)for(let j=1;j<18;j++){const y=12+j*(body-13)/18;b.plane('stone',e,lo,hi,y-.18,y+.18,index,height,.045);}
   b.curtain(e,{from:lo,to:hi,bottom:0,top:11.2,index,height,columns:Math.max(1,Math.round((hi-lo)/3)),rows:2});
   b.plane('stone',e,lo,hi,11.2,12,index,height);b.plane('stone',e,lo,hi,body-1,body,index,height);
  }
  b.roof(cells,body,index,height);
  // Four corner piers, an actual open upper room and a perimeter crown.
  // Side daylight is retained as well as front/back daylight.
  const pier=7.2,cap=3.2;
  for(const x of [x0+pier/2,x1-pier/2])for(const z of [z0+pier/2,z1-pier/2])b.box('stone',x,body,z,pier,MAIN_HEIGHTS.portal-cap,pier,index,height);
  for(const z of [z0+pier/2,z1-pier/2])b.box('stone',cx,height-cap,z,w,cap,pier,index,height);
  for(const x of [x0+pier/2,x1-pier/2])b.box('stone',x,height-cap,cz,pier,cap,d-2*pier,index,height);
  if(!b.gray){
   for(let i=0;i<=9;i++)b.box('frame',x0+1+i*(w-2)/9,height-.85,cz,.13,.6,d-2,index,height);
   // Reuse R5's documented oval; bake it into the one owner/material batches.
   const detail=createMainERoofDetail({footprint:bb,height,baseY});detail.updateMatrixWorld(true);
   const mats=new Set();detail.traverse(m=>{if(!m.isMesh)return;b.add(m.name.includes('shade')?'dark':'frame',m.geometry.clone().applyMatrix4(m.matrixWorld),index,height);m.geometry.dispose();mats.add(m.material);});for(const m of mats)m.dispose();
  }
 }
 const asset=b.finish({owner:'main-complex-asset.js',osmIds:MAIN_IDS,parts:parts.map(({building,index,...p})=>({...p,buildingId:building.id,index})),
  evidence:'docs/quality-v2/buildings-r12/evidence.json',heightPolicy:'E approximately 100m, four-storey wings approximately 22m, mapped low connection approximately 5.4m; all unsurveyed',
  sourceDataUnchanged:true,noEarthworks:true,unmodeled:'Precise floor datums, rear bridges and the podium ground section need plans'});
 return asset;
}
