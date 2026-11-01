// R29: Occlusion-aware 3D building inspection, using existing real OSM footprints
// and procedural tree locations. The function is pure and called only on CTA.
const good2=a=>Array.isArray(a)&&a.length===2&&a.every(Number.isFinite)
const cross=(ax,az,bx,bz)=>ax*bz-az*bx
function pointIn(p,polygon){
 let inside=false
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j]
  if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside
 }
 return inside
}
function segmentPolygonHits(start,end,poly){
 const dx=end[0]-start[0],dz=end[2]-start[2],times=[]
 if(pointIn([start[0],start[2]],poly))times.push(.001)
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length]
  const qx=a[0]-start[0],qz=a[1]-start[2],ex=b[0]-a[0],ez=b[1]-a[1]
  const den=cross(dx,dz,ex,ez)
  if(Math.abs(den)<1e-7)continue
  const t=cross(qx,qz,ex,ez)/den,u=cross(qx,qz,dx,dz)/den
  if(t>=0&&t<.95&&u>=0&&u<=1)times.push(t)
 }
 return times
}
function lineCrownInterception(start,end,tree){
 if(!Number.isFinite(tree?.x)||!Number.isFinite(tree?.z)||!Number.isFinite(tree?.r)||!Number.isFinite(tree?.h))return false
 const dx=end[0]-start[0],dz=end[2]-start[2],len2=dx*dx+dz*dz
 if(len2<1e-5)return false
 const t=Math.max(0,Math.min(.94,((tree.x-start[0])*dx+(tree.z-start[2])*dz)/len2))
 const x=start[0]+dx*t,z=start[2]+dz*t
 if(Math.hypot(x-tree.x,z-tree.z)>tree.r+0.8)return false
 const y=start[1]+(end[1]-start[1])*t
 const crownMin=1.1+tree.h*.45,crownMax=1.1+tree.h+tree.r*.7
 return y>=crownMin&&y<=crownMax
}
export function measureBuildingViewOcclusion(frame,{building,buildings=[],trees=[],boundary=[]}={}){
 if(!frame?.position||!frame?.target||!building)return {score:Infinity,buildingHits:0,treeHits:0,outsideCampus:false}
 const eye=frame.position,focus=frame.target
 // Judge the visible facade, not merely a single centre ray. A tall foreground
 // mass may hide the bottom half while the centre line flies over its roof.
 const sideX=eye[2]-focus[2],sideZ=-(eye[0]-focus[0]),sideLen=Math.hypot(sideX,sideZ)||1
 const width=Math.max(...building.points.map(p=>p[0]))-Math.min(...building.points.map(p=>p[0]))
 const depth=Math.max(...building.points.map(p=>p[1]))-Math.min(...building.points.map(p=>p[1]))
 const spread=Math.max(3,Math.min(9,Math.min(width,depth)*.25))
 const sx=sideX/sideLen*spread,sz=sideZ/sideLen*spread
 const lower=[focus[0],Math.max(2,focus[1]-Math.min(9,(building.displayHeight||building.height||14)*.57)),focus[2]]
 const sights=[focus,lower,[focus[0]+sx,focus[1],focus[2]+sz],[focus[0]-sx,focus[1],focus[2]-sz]]
 let buildingHits=0,treeHits=0,unsafeEye=false
 for(const other of buildings){
  if(!other||other===building||other.osmId===building.osmId||!Array.isArray(other.points)||other.points.length<3||!other.points.every(good2))continue
  const top=1.1+(Number.isFinite(other.displayHeight)?other.displayHeight:other.height||14)
  for(const sight of sights){
   const hit=segmentPolygonHits(eye,sight,other.points)
   if(hit.some(t=>eye[1]+t*(sight[1]-eye[1])<top+1.2))buildingHits++
  }
  if(pointIn([eye[0],eye[2]],other.points)&&eye[1]<top+3)unsafeEye=true
 }
 for(const tree of trees)for(const sight of sights)if(lineCrownInterception(eye,sight,tree))treeHits++
 const outsideCampus=boundary.length>0&&!boundary.some(poly=>pointIn([eye[0],eye[2]],poly))
 // Buildings are effectively opaque; trees are only an approximate crown test.
 return {score:buildingHits*30+treeHits*5+(unsafeEye?150:0)+(outsideCampus?18:0),
  buildingHits,treeHits,outsideCampus,unsafeEye}
}
export function resolveOccludedBuildingView(frame,{building,buildings=[],trees=[],boundary=[]}={}){
 if(!frame?.position||!frame?.target||!building)return frame
 const original=measureBuildingViewOcclusion(frame,{building,buildings,trees,boundary})
 if(original.score===0)return frame // A clear photo-facing view must remain exactly unchanged.
 const focus=frame.target,eye=frame.position
 const dx=eye[0]-focus[0],dz=eye[2]-focus[2],dy=eye[1]-focus[1]
 const distance=Math.hypot(dx,dy,dz),azimuth=Math.atan2(dx,dz),pitch=Math.asin(Math.max(-.9,Math.min(.9,dy/distance)))
 if(!Number.isFinite(distance)||distance<4)return frame
 const angles=[0,-.15,.15,-.3,.3,-.48,.48,-.65,.65]
 const elevations=[0,.08,.16]
 const scale=frame.coverage==='photo-facade-direction'?[1,.90]:[1,.90,1.12]
 let best=frame,bestScore=original.score
 for(const angle of angles)for(const lift of elevations)for(const zoom of scale){
  if(angle===0&&lift===0&&zoom===1)continue
  const angleP=pitch+lift
  const maxPitch=frame.coverage==='photo-facade-direction'?.45:.71
  if(angleP>maxPitch)continue
  const dist=Math.min(145,Math.max(45,distance*zoom)),horizontal=dist*Math.cos(angleP),vertical=dist*Math.sin(angleP)
  const candidate={...frame,
   position:[focus[0]+horizontal*Math.sin(azimuth+angle),focus[1]+vertical,focus[2]+horizontal*Math.cos(azimuth+angle)],
   target:[...focus],distance:dist}
  const observation=measureBuildingViewOcclusion(candidate,{building,buildings,trees,boundary})
  const penalty=Math.abs(angle)*2.2+lift*4+Math.abs(zoom-1)*3
  const total=observation.score+penalty
  if(total<bestScore-.01){bestScore=total;best={...candidate,occlusion:{...observation,baselineScore:original.score}}}
 }
 return best
}
