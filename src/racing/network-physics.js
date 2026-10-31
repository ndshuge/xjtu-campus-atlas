/** Streaming physics proxies for an OSM-connected campus road network. No fake render meshes. */
import * as CANNON from 'cannon-es'
import {BASE,pointSegment} from '../geo.js'
import {nearestRoad} from './road-network.js'
import {mappedRoadSurfaceHeight,buildSharedJunctions} from './road-surface.js'
const dist2=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])
const pxz=p=>p.length===3?[p[0],p[2]]:[p[0],p[1]]
const isPoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)

export function createStreamedRoadColliders({
 physics,network,data,trees=[],radius=130,refreshDistance=30
}={}){
 if(!physics?.world||!network?.segments?.length)throw Error('Cannon physics and connected OSM network required')
 if(!Number.isFinite(radius)||radius<35||radius>300||
   !Number.isFinite(refreshDistance)||refreshDistance<5||refreshDistance>=radius/2)
  throw new RangeError('Invalid collider stream radius/refresh distance')
 const world=physics.world
 // Physics world already configures SAPBroadphase in createRacingPhysics.
 const edges=[]
 for(const building of data?.buildings||[]){
  const p=building.points
  if(!Array.isArray(p)||p.length<3||!p.every(isPoint))continue
  for(let i=0;i<p.length;i++){
   const a=p[i],b=p[(i+1)%p.length],len=dist2(a,b)
   if(len>.5 && len<120)edges.push({id:'building-'+building.id+'-'+i,a,b,len})
  }
 }
 const junctions=buildSharedJunctions(network)
 const active=new Map()
 // Continuous flat collision substrate matches the current schematic campus
 // ground. It remains available when the vehicle leaves OSM road slabs.
 active.set('campus-terrain',makeBody({id:'campus-terrain',kind:'terrain'}))
 let lastCenter=null,swaps=0,destroyed=false
 function makeBody(info){
  const body=new CANNON.Body({mass:0,material:world.defaultMaterial})
  if(info.kind==='terrain'){
   body.addShape(new CANNON.Plane())
   body.position.set(0,BASE+.025,0)
   body.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2)
  }else if(info.kind==='junction'){
   body.addShape(new CANNON.Cylinder(info.radius,info.radius,.36,12))
   body.position.set(info.point[0],info.top-.18,info.point[1])
  }else if(info.kind==='tree'){
   body.addShape(new CANNON.Cylinder(.28,.32,4,8))
   body.position.set(info.x,BASE+2,info.z)
  }else{
   const a=info.a,b=info.b
   const dx=b[0]-a[0],dz=b[1]-a[1],len=dist2(a,b)
   if(info.kind==='road'){
    body.addShape(new CANNON.Box(new CANNON.Vec3(info.width/2,.18,(len+.75)/2)))
    body.position.set((a[0]+b[0])/2,mappedRoadSurfaceHeight(info)-.18,(a[1]+b[1])/2)
   }else{
    body.addShape(new CANNON.Box(new CANNON.Vec3(.22,2.5,len/2)))
    body.position.set((a[0]+b[0])/2,BASE+2.5,(a[1]+b[1])/2)
   }
   body.quaternion.setFromAxisAngle(new CANNON.Vec3(0,1,0),Math.atan2(dx,dz))
  }
  world.addBody(body)
  return {id:info.id,kind:info.kind,body}
 }
 let currentStats={roadSlabs:0,junctionPads:0,buildingEdges:0,trunks:0,terrainBodies:1,activeBodies:1,swaps}
 const physicsRange=radius
 function update(position){
  if(destroyed)throw Error('Road collider stream already destroyed')
  if(!Array.isArray(position)||(position.length!==3&&position.length!==2)||!position.every(Number.isFinite))
   throw new TypeError('finite vehicle position required')
  const p=pxz(position)
  if(lastCenter&&dist2(p,lastCenter)<refreshDistance)return currentStats
  const wanted=new Map()
  wanted.set('campus-terrain',{id:'campus-terrain',kind:'terrain'})
  for(const s of network.segments){
   if(pointSegment(p,s.a,s.b).distance<=physicsRange+s.width/2)
    wanted.set('road-'+s.id,{...s,kind:'road'})
  }
  for(const j of junctions){
   if(dist2(p,j.point)<=physicsRange+j.radius)wanted.set(j.id,j)
  }
  for(const e of edges){
   if(pointSegment(p,e.a,e.b).distance<=physicsRange)
    wanted.set(e.id,{...e,kind:'building'})
  }
  // Obstacles now follow the vehicle across grass, plazas and athletic fields.
  // Keep only the nearest 90 tree trunks: bounded physics cost without a
  // roadway-only blind spot. Stable original indices prevent stale tree IDs.
  const nearbyTrees=[]
  for(let i=0;i<trees.length;i++){
   const tree=trees[i]
   if(!Number.isFinite(tree?.x)||!Number.isFinite(tree?.z))continue
   const d=Math.hypot(tree.x-p[0],tree.z-p[1])
   if(d>Math.min(physicsRange,95))continue
   nearbyTrees.push({index:i,tree,d})
  }
  nearbyTrees.sort((a,b)=>a.d-b.d)
  for(const {index,tree} of nearbyTrees.slice(0,90)){
   const nearest=nearestRoad(network,[tree.x,tree.z])
   if(nearest&&nearest.distance<nearest.width/2+1.3)continue
   const id='tree-'+index
   wanted.set(id,{id,kind:'tree',x:tree.x,z:tree.z})
  }
  // Add replacement ground BEFORE removing stale slabs: avoid transient gaps at junctions.
  for(const [id,info] of wanted)if(!active.has(id))active.set(id,makeBody({...info,id}))
  for(const [id,old] of active)if(!wanted.has(id)){world.removeBody(old.body);active.delete(id)}
  lastCenter=p
  swaps++
  let roadSlabs=0,junctionPads=0,buildingEdges=0,trunks=0,terrainBodies=0
  for(const o of active.values()){
   if(o.kind==='road')roadSlabs++
   else if(o.kind==='junction')junctionPads++
   else if(o.kind==='building')buildingEdges++
   else if(o.kind==='terrain')terrainBodies++
   else trunks++
  }
  currentStats={roadSlabs,junctionPads,buildingEdges,trunks,terrainBodies,activeBodies:active.size,swaps}
  return currentStats
 }
 return {
  update,nearest:p=>nearestRoad(network,p),
  get proxies(){return [...active.values()]},
  get collisionStats(){return currentStats},
  destroy(){if(destroyed)return;destroyed=true;for(const o of active.values())world.removeBody(o.body);active.clear();lastCenter=null}
 }
}
