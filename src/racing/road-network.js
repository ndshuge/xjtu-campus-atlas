/** Read-only OSM road topology: nodes must actually be shared, never inferred from a crossing. */
import {pointSegment} from '../geo.js'
export const R19_START_ROAD='way/148313517/0'
const kinds=new Set(['unclassified','service','residential','living_street'])
const valid=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)
const length=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])
const key=p=>p[0].toFixed(3)+','+p[1].toFixed(3)
const toXZ=p=>p.length>=3?[p[0],p[2]]:[p[0],p[1]]

export function createCampusRoadNetwork(data,{startRoadId=R19_START_ROAD}={}){
 const candidates=(data?.roads||[]).filter(r=>r.campus===true&&
  kinds.has(r.kind)&&Number.isFinite(r.width)&&r.width>=3.5&&r.width<=12&&
  r.points?.length>=2&&r.points.every(valid))
 const adjacency=new Map()
 for(const r of candidates){
  for(const p of r.points){
   const k=key(p),ids=adjacency.get(k)||new Set()
   ids.add(r.id);adjacency.set(k,ids)
  }
 }
 const byId=new Map(candidates.map(r=>[r.id,r]))
 if(!byId.has(startRoadId))throw Error('No valid mapped starting campus road: '+startRoadId)
 const connected=new Set([startRoadId]),queue=[startRoadId]
 for(let i=0;i<queue.length;i++){
  const road=byId.get(queue[i])
  for(const p of road.points)for(const id of adjacency.get(key(p))||[]){
   if(connected.has(id))continue
   connected.add(id);queue.push(id)
  }
 }
 const roads=candidates.filter(r=>connected.has(r.id))
 const segments=[]
 let lengthMeters=0
 for(const r of roads)for(let i=1;i<r.points.length;i++){
  const a=r.points[i-1],b=r.points[i],meters=length(a,b)
  if(meters<.2)continue
  lengthMeters+=meters
  segments.push({id:r.id+':'+i,roadId:r.id,name:r.name||'校园内部道路',
   kind:r.kind,width:r.width,a:[...a],b:[...b],length:meters})
 }
 return {roads,segments,lengthMeters,sourceRoadCount:candidates.length,originRoadId:startRoadId,
  connectivity:'shared-osm-vertex',elevation:'flat-unmeasured'}
}

const PRIMARY_STARTS=['梧桐东道','梧桐西道','文治路','思源路','彭康路','学森路']
export function listDriveStartingRoads(network){
 return PRIMARY_STARTS.map(name=>{
  const roads=network.roads.filter(r=>r.name===name)
  if(!roads.length)return null
  // Use the longest mapped section of a named street for a useful spawn.
  const road=roads.reduce((best,r)=>{
   const n=r.points.slice(1).reduce((s,p,i)=>s+length(p,r.points[i]),0)
   return n>best.len?{road:r,len:n}:best
  },{road:null,len:0}).road
  return {id:road.id,name,kind:road.kind,width:road.width}
 }).filter(Boolean)
}
export function nearestRoad(network,position){
 if(!Array.isArray(position)||!(position.length===2||position.length===3)||!position.every(Number.isFinite))
  throw new TypeError('finite position required')
 const p=toXZ(position)
 let best=null,distance=Infinity
 for(const seg of network.segments){
  const d=pointSegment(p,seg.a,seg.b).distance
  if(d<distance){distance=d;best=seg}
 }
 return best?{...best,distance,id:best.roadId}:null
}
export function roadDistance(network,position){return nearestRoad(network,position)?.distance??Infinity}
