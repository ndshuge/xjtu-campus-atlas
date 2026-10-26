import * as THREE from 'three';
import {libraryMassingPlan} from './library-massing.js';
import {LIBRARY_TIERS} from './library-facade.js';
import {bounds} from './geo.js';

export const LIBRARY_OSM_ID=263624481;
export const LIBRARY_MAX_HEIGHT=49.75;
export const signedArea=ps=>ps.reduce((s,p,i)=>{const q=ps[(i+1)%ps.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2;
const near=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1])<.002;
export function openRing(ps){const r=ps.map(p=>p.slice());if(near(r[0],r.at(-1)))r.pop();return signedArea(r)>0?r:r.reverse();}

// Clip already triangulated plan cells. Each cell stays convex, even where the
// source OSM outline is concave/disconnected after a rectangular intersection.
export function clipCell(points,rect){
 let ps=points;
 for(const [axis,limit,sign] of [[0,rect[0],1],[0,rect[2],-1],[1,rect[1],1],[1,rect[3],-1]]){
  const result=[];
  for(let i=0;i<ps.length;i++){
   const a=ps[i],b=ps[(i+1)%ps.length],insideA=sign*(a[axis]-limit)>=-1e-8,insideB=sign*(b[axis]-limit)>=-1e-8;
   if(insideA)result.push(a);
   if(insideA!==insideB){const t=(limit-a[axis])/(b[axis]-a[axis]);result.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
  }
  ps=result.filter((p,i)=>!i||!near(p,result[i-1]));
  if(ps.length>1&&near(ps[0],ps.at(-1)))ps.pop();
  if(ps.length<3)return [];
 }
 return Math.abs(signedArea(ps))>.00001?ps:[];
}
export function planCells(points,rect){
 const ring=openRing(points),vs=ring.map(p=>new THREE.Vector2(...p));
 return THREE.ShapeUtils.triangulateShape(vs,[]).map(t=>openRing(t.map(i=>ring[i]))).map(p=>rect?clipCell(p,rect):p).filter(p=>p.length>2);
}

// Cancel internal triangulation edges, then join adjacent collinear boundary
// segments. Architectural bays therefore follow whole facades, not triangles.
export function cellBoundary(cells){
 const key=p=>p.map(x=>Math.round(x*1e5)).join(','),edges=new Map();
 for(const ps of cells)for(let i=0;i<ps.length;i++){
  const a=ps[i],b=ps[(i+1)%ps.length],ak=key(a),bk=key(b),reverse=bk+'|'+ak;
  if(edges.has(reverse))edges.delete(reverse);else edges.set(ak+'|'+bk,{a,b});
 }
 const lines=new Map();
 for(const {a,b} of edges.values()){
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length<.001)continue;
  const ux=(b[0]-a[0])/length,uz=(b[1]-a[1])/length,nx=uz,nz=-ux,d=nx*a[0]+nz*a[1];
  const k=[ux,uz,d].map(x=>Math.round(x*1e5)).join(',');
  const range=[ux*a[0]+uz*a[1],ux*b[0]+uz*b[1]];
  if(!lines.has(k))lines.set(k,{ux,uz,nx,nz,d,ranges:[]});lines.get(k).ranges.push(range);
 }
 const result=[];
 for(const line of lines.values()){
  line.ranges.sort((a,b)=>a[0]-b[0]);const merged=[];
  for(const range of line.ranges){const last=merged.at(-1);if(last&&range[0]<=last[1]+.002)last[1]=Math.max(last[1],range[1]);else merged.push(range.slice());}
  for(const [start,end] of merged){const {ux,uz,nx,nz,d}=line;
   result.push({a:[ux*start+nx*d,uz*start+nz*d],b:[ux*end+nx*d,uz*end+nz*d],ux,uz,nx,nz,length:end-start});
  }
 }
 return result;
}

export function libraryAssetPlan(building){
 if(building?.osmId!==LIBRARY_OSM_ID)throw Error('R11 asset requires the original library building');
 const inherited=libraryMassingPlan(building.points);
 if(!inherited)throw Error('Library OSM seams changed; photo/plan review required');
 const fp=building.points,find=p=>fp.findIndex(q=>near(q,p));
 const right=find([-23.066,-160.189]),left=find([-36.681,-159.846]);
 if(right<0||left<right)throw Error('Unreviewed southern library topology');
 const south=[...fp.slice(right,left+1),fp[right]],bb=bounds(fp),cx=(bb[0]+bb[2])/2,cz=bb[3]-21;
 const lowWings=inherited.southRoofWings.map(wing=>({...wing,bottom:0,top:13,rows:3,cells:planCells(wing.points),
  section:'Three-storey southern low wing; exact I/III numbering not verified'}));
 const excluded=new Set(),internalSeams=[];
 for(const wing of lowWings){
  const start=south.findIndex(p=>near(p,wing.points[0])),end=south.findIndex(p=>near(p,wing.points.at(-2)));
  if(start<0||end<=start)throw Error('Southern wing segmentation requires renewed evidence');
  for(let i=start+1;i<end;i++)excluded.add(i);
  internalSeams.push([south[start],south[end]]);
 }
 const southCore=south.filter((_,i)=>!excluded.has(i));
 const zones=inherited.zones.map(z=>({...z,bottom:0,top:z.height,cells:planCells(z.points),rows:z.levels}));
 zones.push(...lowWings,{id:'south-II-podium',points:southCore,bottom:0,top:13,rows:3,cells:planCells(southCore)});
 let bottom=13;
 const courses=LIBRARY_TIERS.map((tier,i)=>{
  const rect=[cx-tier.w/2,cz-tier.d/2,cx+tier.w/2,cz+tier.d/2],top=13+tier.h;
  const course={id:'south-course-'+(i+1),points:south,rect,bottom,top,rows:[2,2,2,1,1][i],glass:tier.glass,cells:planCells(south,rect)};
  bottom=top;return course;
 });
 zones.push(...courses);
 return {osmId:building.osmId,buildingId:building.id,centerX:cx,steppedCenterZ:cz,zones,south,courses,internalSeams,
  maxHeight:LIBRARY_MAX_HEIGHT,levels:{north:4,stack:5,south:11},
  heightScope:'49.75m applies only to the southern principal volume; north/stack/low wings have independent estimated heights',
  researchCommit:'506052b',
  accuracy:'Published floor counts; R7 OSM seams retained; 3.5m north storeys and southern tier heights/setbacks estimated; roof pitch estimated',
  coordinates:{units:'metres',x:'east',y:'up',z:'south',geometry:'campus projected coordinates; identity root transform'},
  gates:{sunkenCourtyard:'retained without excavation',raisedCurvedWalkway:'not inferred'}};
}
