import * as THREE from 'three';
import {architectureBatch, stoneMaterial, glassMaterial} from './architecture-kit.js';

// Overlay-only construction: the imported OSM footprints remain authoritative.
// No ground, road, foliage, boundary or underground terrain geometry is generated.
export const BUILDING_IDS = Object.freeze({
  library: 263624481,
  mainE: 263624057,
  mainWings: [263624058,263624059,263624060,263624061],
  science: 263632364
});

const bounds = pts => [
  Math.min(...pts.map(p=>p[0])),Math.min(...pts.map(p=>p[1])),
  Math.max(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[1]))
];

function polygonArea(pts) {
  let sum=0;
  for(let i=0;i<pts.length;i++){
    const a=pts[i],c=pts[(i+1)%pts.length];
    sum+=a[0]*c[1]-c[0]*a[1];
  }
  return sum/2;
}
function rectOnEdge(batch,kind,x,y,z,w,h,d,angle){
  const geometry=new THREE.BoxGeometry(w,h,d);
  geometry.rotateY(angle);
  geometry.translate(x,y+h/2,z);
  batch.add(kind,geometry);
}
function edgePoints(pts) {
  const sign=polygonArea(pts)>=0?1:-1;
  const arr=[];
  for(let i=0;i<pts.length;i++){
    const a=pts[i],c=pts[(i+1)%pts.length],dx=c[0]-a[0],dz=c[1]-a[1],length=Math.hypot(dx,dz);
    if(length<6)continue;
    const nx=sign*dz/length,nz=-sign*dx/length;
    arr.push({a,c,length,nx,nz,angle:-Math.atan2(dz,dx)});
  }
  return arr;
}
function fenestrate(batch,edge,{baseY,height,floorSpacing=3.55,openingWidth=2.0,glassHeight=2.25,offset=.20,skip}){
  if(skip?.(edge))return;
  const {a,c,length,nx,nz,angle}=edge;
  const floorCount=Math.max(2,Math.floor((height-2)/floorSpacing));
  const count=Math.max(1,Math.floor((length-1.7)/3.45));
  if(length<10 || count<2)return;
  for(let r=0;r<floorCount;r++){
    const y=baseY+1.25+r*floorSpacing;
    if(y+glassHeight>baseY+height-.8)break;
    for(let k=0;k<count;k++){
      const t=(k+.5)/count;
      const px=a[0]+(c[0]-a[0])*t+nx*offset;
      const pz=a[1]+(c[1]-a[1])*t+nz*offset;
      rectOnEdge(batch,'glass',px,y,pz,Math.min(openingWidth,length/count*.68),glassHeight,.22,angle);
      // Horizontal limestone head makes reading as a single building facade clear
      // from 50–200 m, without modelling individually recessed window frames.
      rectOnEdge(batch,'frame',px,y+glassHeight+.12,pz+0*nx,Math.min(openingWidth+.35,length/count*.79),.14,.30,angle);
    }
  }
  const centerX=(a[0]+c[0])/2+nx*.3,centerZ=(a[1]+c[1])/2+nz*.3;
  rectOnEdge(batch,'cornice',centerX,baseY+height-.48,centerZ,length,.62,.66,angle);
  rectOnEdge(batch,'frame',centerX,baseY+.55,centerZ,length,.28,.37,angle);
}

function mainWings(buildings,baseY){
  const mat={
    glass:glassMaterial('#344c59'),
    frame:stoneMaterial('#c5b9a9',1.5),
    cornice:stoneMaterial('#b5ac9d',1.0),
    roof:stoneMaterial('#938f86',.9)
  };
  const b=architectureBatch('Main A/B/C/D | photo-referenced wings and roofline',mat);
  let modeled=0,windowEdges=0;
  for(const id of BUILDING_IDS.mainWings){
    const wing=buildings.find(v=>v.osmId===id);if(!wing)continue;
    const bb=bounds(wing.points);
    // The wings preserve their existing OSM footprint, height and orientation.
    // Photo evidence supports regularly repeated dark window bays with pale piers.
    for(const e of edgePoints(wing.points)){
      if(e.length<12)continue;
      fenestrate(b,e,{baseY,height:wing.height,glassHeight:2.25,floorSpacing:3.75,openingWidth:2.1});
      windowEdges++;
    }
    // Roof parapets run inside the mapped footprint; no invented extra floors.
    const cx=(bb[0]+bb[2])/2,cz=(bb[1]+bb[3])/2;
    const roofW=Math.min(8,(bb[2]-bb[0])*.3);
    b.box('roof',cx,baseY+wing.height+.12,cz,roofW,.30,Math.min(7,(bb[3]-bb[1])*.22));
    modeled++;
  }
  const g=b.finish();
  g.userData={scope:'Main A-D only',osmIds:BUILDING_IDS.mainWings,
    geometryBasis:'OSM footprints/heights; photo-informed facade cadence',reference:'https://wmw.xjtu.edu.cn/wh/dbcg1.htm',estimated:true,
    modeled,windowEdges};
  return g;
}

function northLibrary(buildings,baseY){
  const lib=buildings.find(v=>v.osmId===BUILDING_IDS.library);
  const mat={
    glass:glassMaterial('#4e6370'),
    frame:stoneMaterial('#c9c2b7',1.3),
    cornice:stoneMaterial('#b3aa9d',1),
    roof:stoneMaterial('#9faaa5',1)
  };
  const b=architectureBatch('Qian Xuesen Library | north wing photographic articulation',mat);
  if(!lib)return b.finish();
  // The southern 1991 high-rise and clock/stepped entry are already modeled by
  // src/library-facade.js and src/library-clock.js. Do not duplicate those forms.
  // The north 1961 low wing is represented by the EXISTING 13m OSM volume.
  // Here only its legible external fenestration and continuous parapet are added.
  let edges=0;
  for(const edge of edgePoints(lib.points)){
    const midZ=(edge.a[1]+edge.c[1])/2;
    if(midZ > -147 || edge.length<12)continue;
    fenestrate(b,edge,{baseY,height:13,glassHeight:2.25,floorSpacing:3.35,openingWidth:1.9});
    edges++;
  }
  const g=b.finish();g.userData={osmId:BUILDING_IDS.library,wing:'north',
    officialNorthYear:1961,officialSouthYear:1991,officialSouthHeight:49.75,
    estimated:true,roofPolicy:'no extra storeys',sunkenCourtyard:'not modeled',
    source:'https://news.xjtu.edu.cn/info/1219/153497.htm',edges};
  return g;
}

function scienceHall(buildings,baseY){
  const hall=buildings.find(v=>v.osmId===BUILDING_IDS.science);
  const mat={
    glass:glassMaterial('#2c667f'),
    frame:new THREE.MeshStandardMaterial({color:'#66716d',metalness:.38,roughness:.48}),
    cornice:stoneMaterial('#97745b',2.6),
    brick:stoneMaterial('#a78569',2.2),
    roof:stoneMaterial('#918a7c',1.8)
  };
  const b=architectureBatch('Yifu Science Hall | brick/glazing and entrance mass refinement',mat);
  if(!hall)return b.finish();
  // Entrance is on the west-facing articulated volume. Preserve current
  // roof truss and vestibule in cultural-facades.js; add only regional wall
  // material and dark vertical recesses on the existing OSM boundaries.
  let edges=0;
  for(const edge of edgePoints(hall.points)){
    const midX=(edge.a[0]+edge.c[0])/2;
    const midZ=(edge.a[1]+edge.c[1])/2;
    if(edge.length<14)continue;
    // Avoid placing repeated windows across the western glazed entry atrium;
    // its main facade has a large uninterrupted reflective curtain wall.
    if(midX<70 && midZ>-43 && midZ<5)continue;
    const smallWindow=edge.length<30?1.6:1.95;
    fenestrate(b,edge,{baseY,height:hall.height,floorSpacing:3.65,glassHeight:2.1,openingWidth:smallWindow,offset:.31,
      skip:e=>((e.a[0]+e.c[0])/2)<57&&((e.a[1]+e.c[1])/2)>-43});
    edges++;
  }
  // Brick piers are visible at each side of the real glazed north-west corner;
  // shallow geometry ensures we don't alter the OSM ground outline.
  b.box('brick',64.7,baseY+2.1,-24.1,.60,Math.min(hall.height-3,15),1.65);
  b.box('roof',73,baseY+hall.height-.36,-41.3,17,.72,1.4);
  const g=b.finish();g.userData={osmId:BUILDING_IDS.science,
    source:'https://wmw.xjtu.edu.cn/wh/dbcg1/2.htm',
    facadeObservation:'brick wings, reflective glazing, triangular roof and broad entry canopy',
    geometryBasis:'OSM and visual structural cues; all non-OSM lengths approximate',
    estimated:true,edges};
  return g;
}

export function createBuildingSilhouettes(buildings,{baseY=1.1}={}){
  if(!Array.isArray(buildings))throw Error('Expected building array');
  const group=new THREE.Group();group.name='Buildings-only silhouette improvements (isolated)';
  for(const piece of [mainWings(buildings,baseY),northLibrary(buildings,baseY),scienceHall(buildings,baseY)])group.add(piece);
  group.userData={scope:'building-exclusive visual augmentation',editingSharedWorld:false,
    noSubsurfaceInference:true,noFoliageRoadWallEdits:true,referenceVersion:'2026-10-26'};
  return group;
}
