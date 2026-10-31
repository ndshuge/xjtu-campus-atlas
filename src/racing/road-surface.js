/** Height contract copied from CampusWorld.buildRoads; data is flat/un-surveyed. */
import {BASE} from '../geo.js'
const spine=/^(思源路|彭康路|学森路|文治路|梧桐东道|梧桐西道|学苑东路|学苑西路)$/
export function mappedRoadSurfaceHeight(road){
 if(!road||typeof road!=='object')throw new TypeError('mapped road required')
 return BASE+(spine.test(road.name||'')?.145:.125)
}
export function buildSharedJunctions(network){
 const nodes=new Map()
 const key=p=>p[0]+','+p[1]
 for(const seg of network?.segments||[]){
  for(const p of [seg.a,seg.b]){
   const k=key(p),n=nodes.get(k)||{id:'junction-'+k,point:[...p],segments:[],width:0,roadNames:new Set()}
   n.segments.push(seg)
   n.width=Math.max(n.width,seg.width)
   n.roadNames.add(seg.roadId)
   nodes.set(k,n)
  }
 }
 const junctions=[]
 for(const n of nodes.values()){
  if(n.segments.length<3)continue
  // Each pad belongs to a *recorded* shared OSM vertex; never add one
  // where polylines cross but do not have a shared point in source data.
  const y=Math.max(...n.segments.map(s=>mappedRoadSurfaceHeight(s)))
  junctions.push({id:n.id,kind:'junction',point:n.point,radius:n.width*.53,top:y,
    connectedWays:n.roadNames.size})
 }
 return junctions
}
