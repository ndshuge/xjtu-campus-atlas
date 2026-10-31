/**
 * R18 campus road physics overlay, not a replacement for OSM or surveyed terrain.
 * Keep Atlas's *original* scene and visual road mesh. All colliders live in
 * Cannon and approximate the locally flat source-authored roadway.
 */
import * as CANNON from 'cannon-es'
import {BASE,pointSegment} from '../geo.js'
import {mountRoadCollisionProxies} from './track.js'

export const CAMPUS_ROUTE_ID='way/148313517/0'
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])
const validPoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)
const drivable=r=>r?.campus===true&&/^(unclassified|service|residential|living_street|track)$/.test(r.kind||'')

export function planCampusDrive(data,{roadId=CAMPUS_ROUTE_ID}={}){
 const road=data?.roads?.find(r=>r.id===roadId)
 if(!drivable(road)||!Array.isArray(road.points)||road.points.length<2||
   !road.points.every(validPoint)||!Number.isFinite(road.width)||
   road.width<4||road.width>12)throw Error('Unsupported or unverified campus roadway')
 const segments=[]
 let lengthMeters=0
 for(let i=1;i<road.points.length;i++){
  const a=road.points[i-1],b=road.points[i],length=dist(a,b)
  if(length<.2)continue
  lengthMeters+=length
  segments.push({a:[...a],b:[...b],length})
 }
 if(!segments.length||lengthMeters<25)throw Error('Road too short for measured vehicle mode')
 const first=segments[0]
 const at=.48
 const spawn=[first.a[0]+(first.b[0]-first.a[0])*at,BASE+1.2,first.a[1]+(first.b[1]-first.a[1])*at]
 const heading=Math.atan2(first.b[0]-first.a[0],first.b[1]-first.a[1])
 return {roadId:road.id,name:road.name||'OSM 校园道路',width:road.width,
  segments,lengthMeters,spawn,heading,roadClass:road.kind,elevation:'unmeasured-flat-proxy'}
}

function routeDistance(p,segments){
 let min=Infinity
 for(const seg of segments)min=Math.min(min,pointSegment(p,seg.a,seg.b).distance)
 return min
}
function makeWall(world,a,b,id,height=5){
 const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz)
 if(length<.5)return null
 const body=new CANNON.Body({mass:0,material:world.defaultMaterial})
 body.addShape(new CANNON.Box(new CANNON.Vec3(.22,height/2,length/2)))
 body.position.set((a[0]+b[0])/2,BASE+height/2,(a[1]+b[1])/2)
 // Along local Z axis, yaw rotates into the mapped polygon boundary.
 body.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0),Math.atan2(dx,dz))
 world.addBody(body)
 return {id,kind:'building',body}
}

export function createCampusDriveTrack({physics,data,course=planCampusDrive(data),trees=[]}={}){
 if(!physics?.world||!course?.segments?.length)throw Error('Road/collision physics required')
 const descriptors=course.segments.map((seg,i)=>{
  const [ax,az]=seg.a,[bx,bz]=seg.b
  const dx=bx-ax,dz=bz-az
  return {id:`osm-${course.roadId}-${i}`,kind:'mapped-road',
   center:[(ax+bx)/2,BASE+.14-.18,(az+bz)/2],
   size:[course.width,.36,seg.length+.7],yaw:Math.atan2(dx,dz)}
 })
 const mounted=mountRoadCollisionProxies(physics,descriptors)
 const others=[]
 let buildingEdges=0,trunks=0
 try{
  for(const b of data?.buildings||[]){
   if(!Array.isArray(b.points)||b.points.length<3||!b.points.every(validPoint))continue
   const points=b.points
   for(let i=0;i<points.length;i++){
    const a=points[i],next=points[(i+1)%points.length]
    if(routeDistance([(a[0]+next[0])/2,(a[1]+next[1])/2],course.segments)>24)continue
    const wall=makeWall(physics.world,a,next,`bldg-${b.id}-${i}`)
    if(wall){others.push(wall);buildingEdges++}
   }
  }
  // Procedural tree trunks are approximate obstacles, not surveyed tree positions.
  for(const t of trees){
   if(trunks>=90)break
   if(!Number.isFinite(t?.x)||!Number.isFinite(t?.z))continue
   const d=routeDistance([t.x,t.z],course.segments)
   if(d<course.width/2+1.35||d>12)continue
   const body=new CANNON.Body({mass:0,material:physics.world.defaultMaterial})
   body.addShape(new CANNON.Cylinder(.28,.32,4,8))
   body.position.set(t.x,BASE+2,t.z)
   physics.world.addBody(body)
   others.push({id:'tree-'+trunks,kind:'tree',body});trunks++
  }
 }catch(e){
  for(const o of others)physics.world.removeBody(o.body)
  mounted.destroy()
  throw e
 }
 let disposed=false
 return {
  proxies:[...mounted.proxies,...others],
  get collisionStats(){return {roadSlabs:mounted.proxies.length,buildingEdges,trunks}},
  destroy(){if(disposed)return;disposed=true;for(const o of others)physics.world.removeBody(o.body);mounted.destroy()}
 }
}
