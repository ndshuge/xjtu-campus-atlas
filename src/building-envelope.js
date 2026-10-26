import {boxGeometry} from './geo.js';

// Opaque architectural cladding, a few centimetres outside the retained OSM
// volume. It hides the generic procedural windows behind dedicated facades.
// No shared world shader, source footprint, terrain or height is changed.
export function facadeEdges(points){
 let area=0;for(let i=1;i<points.length;i++)area+=points[i-1][0]*points[i][1]-points[i][0]*points[i-1][1];
 const sign=area>=0?1:-1;
 return points.slice(1).map((c,i)=>{
  const a=points[i],dx=c[0]-a[0],dz=c[1]-a[1],length=Math.hypot(dx,dz);
  return {a,c,length,nx:sign*dz/(length||1),nz:-sign*dx/(length||1),angle:-Math.atan2(dz,dx)};
 }).filter(e=>e.length>.1);
}
export function onFacade(batch,kind,edge,{along=.5,y,width,height,depth=.08,offset=.045}){
 const g=boxGeometry(0,y,0,width,height,depth);g.rotateY(edge.angle);
 g.translate(edge.a[0]+(edge.c[0]-edge.a[0])*along+edge.nx*offset,0,
  edge.a[1]+(edge.c[1]-edge.a[1])*along+edge.nz*offset);
 batch.add(kind,g);
}
export function addFacadeBacking(batch,kind,edge,baseY,height){
 onFacade(batch,kind,edge,{y:baseY,width:edge.length,height});
}
