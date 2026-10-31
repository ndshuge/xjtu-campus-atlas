import * as THREE from 'three';
import {pointIn,pointSegment} from './geo.js';

/**
 * Visible OSM-derived *schematic* perimeter. The North Gate is separately
 * photo-reconstructed, with an intentional 43 m clearing either side.
 * Gate-adjacent materials beyond photographed sections are deliberately neutral:
 * no claim of measured fence height, period, material, or individual rail design.
 *
 * North Gate reference: XJTU news, 2015-12-02
 * https://news.xjtu.edu.cn/info/1033/11054.htm
 * North Gate side relief documented 2025-12-09, 4.5 m high / 47 m long:
 * https://dwxcb.xjtu.edu.cn/info/1085/17811.htm
 */
export function createCampusPerimeter(boundaries, gates, baseY=1.1, roads=[],buildings=[],verifiedTrees=[]){
 const group=new THREE.Group();
 group.name='Xingqing campus perimeter / schematic enclosure with verified gate openings';
 const gateList=gates.filter(g=>Array.isArray(g.position)&&/门/.test(g.name||'')).map(g=>({
   name:g.name,point:g.position,
   clearance:/北门/.test(g.name)&&!/西北门|东北门/.test(g.name)?43:
     /南门/.test(g.name)&&!/西南门|东南门/.test(g.name)?17:15
 }));
 // Preserve verified entrances AND any OSM road that actually crosses the outline.
 // A road crossing is an access gap, not an invented new architectural gate.
 const intersections=(a,b,c,d)=>{
   const vx=b[0]-a[0],vz=b[1]-a[1],wx=d[0]-c[0],wz=d[1]-c[1],det=vx*wz-vz*wx;
   if(Math.abs(det)<1e-7)return null;
   const qx=c[0]-a[0],qz=c[1]-a[1],t=(qx*wz-qz*wx)/det,u=(qx*vz-qz*vx)/det;
   return t>=-1e-6&&t<=1+1e-6&&u>=-1e-6&&u<=1+1e-6?[a[0]+t*vx,a[1]+t*vz]:null;
 };
 const isInside=p=>boundaries.some(ring=>pointIn(p,ring));
 const mappedRoadPassages=[];
 for(const road of roads.filter(r=>r.campus&&Array.isArray(r.points)&&r.points.length>=2)){
   for(let i=1;i<road.points.length;i++){
     const a=road.points[i-1],b=road.points[i];
     if(isInside(a)===isInside(b))continue;
     for(const ring of boundaries)for(let j=1;j<ring.length;j++){
       const pt=intersections(a,b,ring[j-1],ring[j]);
       if(!pt)continue;
       const clearance=Math.max(4.5,(Number(road.width)||3)/2+2);
       if(gateList.some(g=>Math.hypot(pt[0]-g.point[0],pt[1]-g.point[1])<g.clearance+clearance*.5))continue;
       if(mappedRoadPassages.some(g=>Math.hypot(pt[0]-g.point[0],pt[1]-g.point[1])<clearance*2))continue;
       const opening={name:'OSM road boundary crossing (unverified entrance)',point:pt,clearance};
       mappedRoadPassages.push(opening);gateList.push(opening);
     }
   }
 }
 const segments=[],pillars=[],bars=[],upper=[],middle=[];
 const nearGate=(x,z,extra=0)=>gateList.some(g=>Math.hypot(x-g.point[0],z-g.point[1])<g.clearance+extra);
 const buildingConflict=(x,z,margin)=>buildings.some(b=>{
   if(pointIn([x,z],b.points)&&!(b.holes||[]).some(h=>pointIn([x,z],h)))return true;
   return b.points.slice(1).some((p,i)=>pointSegment([x,z],b.points[i],p).distance<margin);
 });
 let skippedBuildingSegments=0,skippedTreeSegments=0,skippedRoadSegments=0;
 // Only surveyed trees are meaningful constraints; schematic trees are not survey points.
 const treeConflict=(p,margin)=>verifiedTrees.some(t=>Number.isFinite(t.x)&&Number.isFinite(t.z)&&Math.hypot(p[0]-t.x,p[1]-t.z)<Math.max(.35,t.trunkRadius||.35)+margin);
 const roadConflict=(p,margin)=>roads.some(r=>r.campus&&Array.isArray(r.points)&&r.points.slice(1).some((q,i)=>
   pointSegment(p,r.points[i],q).distance<(Number(r.width)||3)/2+margin));
 const record=(list,x,z,len,y,h,depth,angle)=>list.push({x,z,len,y,h,depth,angle});
 for(const ring of boundaries){
   for(let i=1;i<ring.length;i++){
    const a=ring[i-1],b=ring[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
    if(length<.01)continue;
    const steps=Math.ceil(length/3.2),ux=dx/length,uz=dz/length,angle=-Math.atan2(dz,dx);
    for(let j=0;j<steps;j++){
      const start=length*j/steps,end=length*(j+1)/steps,span=end-start;
      const x=a[0]+ux*(start+end)/2,z=a[1]+uz*(start+end)/2;
      if(nearGate(x,z,span/2+.4))continue; // no phantom wall across mapped gates
      // A university boundary can coincide with a building wall. Do not draw
      // invented ironwork through that building; do not move the OSM boundary.
      const samples=[0,.25,.5,.75,1].map(t=>[a[0]+ux*(start+t*span),a[1]+uz*(start+t*span)]);
      if(samples.some(p=>nearGate(p,.45)))continue;
      if(samples.some(p=>buildingConflict(p,.35))||buildingConflict(x,z,span/2+.45)){skippedBuildingSegments++;continue;}
      if(samples.some(p=>roadConflict(p,.25))){skippedRoadSegments++;continue;}
      if(samples.some(p=>treeConflict(p,.5))){skippedTreeSegments++;continue;}
      // Muted schematic guides, NOT invented masonry, fence design or North Gate repeats.
      record(segments,x,z,span,baseY+.18,.36,.25,angle);
      record(upper,x,z,span,baseY+1.72,.075,.11,angle);
      record(middle,x,z,span,baseY+.78,.07,.11,angle);
      if(j%4===0&&!nearGate(x,z,1.1))record(bars,x,z,.11,baseY+1.03,1.4,.11,angle);
      if(j%7===0&&!nearGate(x,z,1.1))record(pillars,a[0]+ux*start,a[1]+uz*start,.24,baseY+.94,1.89,.26,angle);
    }
   }
 }
 const stone=new THREE.MeshStandardMaterial({color:'#929d95',roughness:1});
 const iron=new THREE.MeshStandardMaterial({color:'#87978c',transparent:true,opacity:.42,depthWrite:false,roughness:1});
 function batch(rows,name,material){
   if(!rows.length)return;
   const obj=new THREE.Object3D();
   const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material,rows.length);
   mesh.name=name;mesh.receiveShadow=true;mesh.castShadow=false;
   rows.forEach((p,i)=>{
    obj.position.set(p.x,p.y,p.z);
    obj.rotation.set(0,p.angle,0);
    obj.scale.set(p.len,p.h,p.depth);
    obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);
   });
   mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();group.add(mesh);
 }
 batch(segments,'perimeter masonry plinth / schematic guide, NOT surveyed',stone);
 batch(pillars,'perimeter sparse markers / NOT surveyed piers',stone);
 batch(middle,'perimeter schematic middle guide / NOT verified rail',iron);
 batch(upper,'perimeter schematic upper guide / NOT verified roofline',iron);
 batch(bars,'perimeter schematic uprights / NOT verified infill',iron);
 // Keep actual OSM boundary and passage collision data at all distances.
 // Schematic rail details cannot be resolved in the high-altitude overview;
 // use altitude hysteresis without regenerating any geometry or colliders.
 const rails=group.children.filter(o=>!o.name.includes('masonry plinth'));
 let detailVisible=true;
 group.updateDetailLOD=(camera)=>{
  const y=camera?.position?.y;
  if(!Number.isFinite(y))return;
  const next=detailVisible?y<=520:y<340;
  if(next===detailVisible)return;
  detailVisible=next;for(const rail of rails)rail.visible=next;
 };
 group.userData={
  accuracy:'OSM footprint only; wall details illustrative and NOT verified by photographs',
  referenceGate:'https://news.xjtu.edu.cn/info/1033/11054.htm',
  gateClearances:gateList,
  segmentCount:segments.length,
  wallLengthMetres:Math.round(segments.reduce((sum,p)=>sum+p.len,0)),
  gapCenters:gateList.map(g=>g.point),
  roadCrossingCount:mappedRoadPassages.length,
  geometryVersion:'schematic-perimeter-r7-non-fabricated',
  buildingClearanceGaps:skippedBuildingSegments,treeClearanceGaps:skippedTreeSegments,roadClearanceGaps:skippedRoadSegments,
  colliderSegments:segments.map(p=>({a:[p.x-Math.cos(-p.angle)*p.len/2,p.z-Math.sin(-p.angle)*p.len/2],b:[p.x+Math.cos(-p.angle)*p.len/2,p.z+Math.sin(-p.angle)*p.len/2]}))
 };
 return group;
}

export function perimeterBlocksPosition(perimeter,point,margin=.75){
 return (perimeter?.userData.colliderSegments||[]).some(s=>{
   if(point[0]<Math.min(s.a[0],s.b[0])-margin||point[0]>Math.max(s.a[0],s.b[0])+margin||point[1]<Math.min(s.a[1],s.b[1])-margin||point[1]>Math.max(s.a[1],s.b[1])+margin)return false;
   return pointSegment(point,s.a,s.b).distance<margin+.18;
 });
}
