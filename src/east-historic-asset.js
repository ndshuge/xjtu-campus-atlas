import * as THREE from 'three';
import {ownedArchitecture} from './building-asset-kit.js';
import {planCells,cellBoundary,clipCell} from './library-asset-plan.js';
import {bounds} from './geo.js';

// Historic teaching buildings explicitly described as grey walls/red sloped roofs.
// The mapped footprint, level count and names remain unchanged. The roof form
// is an approximation until individual roof plans and current photographs are available.
export const EAST_HISTORIC_IDS=Object.freeze([263625677,263625678]);

export function createEastHistoricAsset({buildings,baseY=1.1,uniforms={},stage='material'}={}){
 const batch=ownedArchitecture('Historic east teaching buildings',{baseY,uniforms,stage});
 if(!batch.gray){batch.materials.stone.color.set('#aaa9a0');batch.materials.glass.color.set('#52636a');batch.materials.roof.color.set('#a65e50');}
 for(const id of EAST_HISTORIC_IDS){
  const building=buildings.find(item=>item.osmId===id);if(!building)continue;
  const index=buildings.indexOf(building),cells=planCells(building.points),edges=cellBoundary(cells),height=building.height;
  const eaves=height-2.1,rows=building.levels||4;
  for(const edge of edges)batch.wall(edge,{top:eaves,rows,index,height,bayWidth:3.8});
  const bb=bounds(building.points),points=[],step=5;
  const roofHeight=p=>{
   let distance=Infinity;
   for(const edge of edges){const x=p[0]-edge.a[0],z=p[1]-edge.a[1];const t=Math.max(0,Math.min(edge.length,x*edge.ux+z*edge.uz));
    distance=Math.min(distance,Math.hypot(x-edge.ux*t,z-edge.uz*t));}
   return baseY+eaves+Math.min(2.1,distance*.24);
  };
  // A continuous roof height field clipped to the OSM footprint. Grid cells
  // do not overlap, including on concave outlines and courtyard recesses.
  for(let x=bb[0];x<bb[2];x+=step)for(let z=bb[1];z<bb[3];z+=step){
   const rect=[x,z,Math.min(x+step,bb[2]),Math.min(z+step,bb[3])];
   for(const cell of cells){const poly=clipCell(cell,rect);if(poly.length<3)continue;
    for(let j=1;j<poly.length-1;j++)for(const p of [poly[0],poly[j+1],poly[j]])points.push(p[0],roofHeight(p),p[1]);
   }
  }
  const roof=new THREE.BufferGeometry();roof.setAttribute('position',new THREE.Float32BufferAttribute(points,3));roof.computeVertexNormals();batch.add('roof',roof,index,height);
 }
 return batch.finish({owner:'east-historic-asset.js',osmIds:EAST_HISTORIC_IDS,sourceDataUnchanged:true,
  evidence:'docs/quality-v2/R15_EAST_HISTORIC_EVIDENCE.md',unknown:'Individual roof ridges, current facade and exact heights remain approximate'});
}
