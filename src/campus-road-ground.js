import * as THREE from 'three';
import {BASE, ribbon, pointSegment, pointIn} from './geo.js';
import {ROAD_ONLY_BUILDING_MASKS} from './campus-road-exclusions.js';

// Road classes are from XJTU's 2025 road-improvement programme.
// Only OSM-mapped segments are drawn: untraced routes are NOT invented.
// Road/sidewalk dimensions and fine curb details remain interpretive.
export const OFFICIAL_CAMPUS_SPINES = Object.freeze({
  '梧桐东道':'north-south', '梧桐西道':'north-south',
  '学苑东路':'north-south', '学苑西路':'north-south',
  '思源路':'east-west', '彭康路':'east-west',
  '学森路':'east-west', '文治路':'east-west'
});
const tracked = name => Object.prototype.hasOwnProperty.call(OFFICIAL_CAMPUS_SPINES,name);
const pedestrian = r => /footway|path|steps|cycleway/.test(r.kind||'');
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const masks=ROAD_ONLY_BUILDING_MASKS.map(entry=>({
  ...entry,
  bounds:entry.points.reduce((b,p)=>[
    Math.min(b[0],p[0]),Math.min(b[1],p[1]),
    Math.max(b[2],p[0]),Math.max(b[3],p[1])
  ],[Infinity,Infinity,-Infinity,-Infinity])
}));
function footprintBlocked(p,margin=1.2){
  for(const {points,bounds} of masks){
    if(p[0]<bounds[0]-margin||p[0]>bounds[2]+margin||
       p[1]<bounds[1]-margin||p[1]>bounds[3]+margin)continue;
    if(pointIn(p,points))return true;
    for(let i=1;i<points.length;i++)
      if(pointSegment(p,points[i-1],points[i]).distance<margin)return true;
  }
  return false;
}

function resample(points,step=3){
  const out=[points[0]];
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],len=distance(a,b);
    for(let k=1;k<=Math.max(1,Math.ceil(len/step));k++){
      const t=k/Math.max(1,Math.ceil(len/step));
      const p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
      if(distance(out.at(-1),p)>1e-4)out.push(p);
    }
  }
  return out;
}
const otherCarriageway=(p,route,roads)=>{
  for(const r of roads){
    if(r===route||r.id===route.id||r.name===route.name||pedestrian(r)||!r.campus)continue;
    // Terminate the separate sidewalk against intersecting carriageways:
    // overlapping coplanar footway quads create unstable intersections.
    for(let i=1;i<r.points.length;i++)
      if(pointSegment(p,r.points[i-1],r.points[i]).distance<r.width/2+1.35)return true;
  }
  return false;
};
const normalAt=(ps,i,side)=>{
  const a=ps[Math.max(i-1,0)],b=ps[Math.min(i+1,ps.length-1)];
  const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1;
  return [-dz/len*side,dx/len*side];
};
function clippedOffsetRuns(r,roads,side,offset){
  const ps=resample(r.points),runs=[];let run=[];
  const flush=()=>{if(run.length>=2&&distance(run[0],run.at(-1))>1)runs.push(run);run=[];};
  for(let i=0;i<ps.length;i++){
    const point=ps[i],n=normalAt(ps,i,side);
    const target=[point[0]+n[0]*offset,point[1]+n[1]*offset];
    // Endcaps stop before gates or T-junctions, not across them.
    const terminal=(i<2||i>ps.length-3)&&ps.length>7;
    if(terminal||otherCarriageway(target,r,roads)||footprintBlocked(target,offset>r.width/2+.5?1.3:.2)){flush();continue;}
    run.push(target);
  }
  flush();return runs;
}
export function campusSpineGroundGeometry(roads){
  const sidewalks=[],edgings=[],segments=[];
  const found=new Set();
  for(const r of roads){
    if(!r.campus||pedestrian(r)||!tracked(r.name)||r.name==='梧桐东道'||r.points.length<2)continue;
    found.add(r.name);
    let pavementPieces=0;
    for(const side of [-1,1]){
      // The mapped centreline/width remain authoritative; no road rerouting.
      for(const run of clippedOffsetRuns(r,roads,side,r.width/2+1.65)){
        const geometry=ribbon(run,2.05,BASE+.185);
        if(geometry){sidewalks.push(geometry);pavementPieces++;}
      }
      for(const run of clippedOffsetRuns(r,roads,side,r.width/2+.13)){
        const geometry=ribbon(run,.115,BASE+.195);
        if(geometry)edgings.push(geometry);
      }
    }
    segments.push({name:r.name,id:r.id,OSMWidth:r.width,pavementPieces,
      mappedLength:Math.round(r.points.slice(1).reduce((sum,p,i)=>sum+distance(p,r.points[i]),0))});
  }
  return {sidewalks,edgings,segments,found:[...found],
    unavailable:Object.keys(OFFICIAL_CAMPUS_SPINES).filter(name=>name!=='梧桐东道'&&!found.has(name)),
    maxHeight:BASE+.195,lowImpact:true};
}
function paleAggregate(){
  if(typeof document==='undefined')return null;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=96;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#d3d0c6';ctx.fillRect(0,0,96,96);
  let seed=20251026;const next=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  for(let i=0;i<1700;i++){
    const v=160+Math.floor(next()*65);
    ctx.fillStyle='rgba('+v+','+v+','+(v-8)+',0.23)';
    ctx.fillRect(next()*96,next()*96,.3+next()*1.15,.3+next()*1.15);
  }
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=4;return tex;
}
export function addCampusSpineGround(scene,roads){
  const plan=campusSpineGroundGeometry(roads);
  const group=new THREE.Group();group.name='Eight official corridors / mapped hardscape details';
  const pavement=new THREE.MeshStandardMaterial({color:'#e7e5dc',map:paleAggregate(),roughness:.98,
    polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const joint=new THREE.MeshBasicMaterial({color:'#c2c2b2',depthWrite:false});
  for(const [collection,material,name] of [[plan.sidewalks,pavement,'Pale shoulder footpath / approximate'],
    [plan.edgings,joint,'Road/shoulder separation / approximate']]){
    for(const geo of collection){
      const obj=new THREE.Mesh(geo,material);obj.name=name;obj.receiveShadow=true;group.add(obj);
    }
  }
  group.userData={source:'https://www.ef.xjtu.edu.cn/info/1845/7841.htm',
    pavementReference:'https://news.xjtu.edu.cn/info/1002/214178.htm',
    maintenanceReference:'https://news.xjtu.edu.cn/info/1033/223841.htm',
    attribution:'University-published source facts; procedural geometry/texture original.',
    status:'OSM geometry maintained; footpath widths, seam and surface shading approximate',
    found:plan.found,unavailable:plan.unavailable,segments:plan.segments};
  scene.add(group);return group;
}
