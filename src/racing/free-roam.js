import {BASE,pointIn,pointSegment} from '../geo.js'
import {findStadiumInfield} from '../stadium-infield.js'


// Keeps the schematic campus game from appearing to drive across mapped
// water or beyond the published Atlas boundary. Outside the road network
// but *inside* the campus, the car is always free to drive on flat ground.
export function createDriveSafetyGuard(data,{spawn,edgeTolerance=2,notify=()=>{}}={}){
 const polygons=data?.boundary?.filter(poly=>Array.isArray(poly)&&poly.length>=3&&
  poly.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)))||[]
 if(!polygons.length)throw Error('Mapped campus boundary required')
 if(!Number.isFinite(edgeTolerance)||edgeTolerance<0||edgeTolerance>8)
  throw RangeError('Invalid campus edgeTolerance')
 const water=(data?.surfaces||[]).filter(s=>s.kind==='water'&&
  Array.isArray(s.points)&&s.points.length>=3&&
  s.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)))
 function classify(position){
  if(!Array.isArray(position)||!(position.length===2||position.length===3)||!position.every(Number.isFinite))
   throw RangeError('finite position required')
  const p=position.length===3?[position[0],position[2]]:[position[0],position[1]]
  const valid=polygons.some(poly=>pointIn(p,poly)||
   poly.some((a,i)=>pointSegment(p,a,poly[(i+1)%poly.length]).distance<=edgeTolerance))
  if(!valid)return {allowed:false,reason:'outside-campus'}
  if(water.some(s=>pointIn(p,s.points)))return {allowed:false,reason:'water'}
  return {allowed:true,reason:'campus'}
 }
 if(!Array.isArray(spawn)||spawn.length!==3||!spawn.every(Number.isFinite)||!classify(spawn).allowed)
  throw RangeError('verified campus spawn required')
 function recover(physics){
  const state=physics.getState(),surface=classify(state.position)
  if(surface.allowed)return {recovered:false,reason:surface.reason}
  physics.reset(spawn)
  notify(surface.reason)
  return {recovered:true,reason:surface.reason}
 }
 return {classify,recover}
}

/** Only source-confirmed infield centres qualify as preconfigured off-road starts. */
export function planFreeRoamSpawn(data){
 const stadium=data?.surfaces?.find(s=>s.id==='way/263633888')
 const field=findStadiumInfield(stadium,data?.surfaces||[])
 if(!field||!Array.isArray(field.center)||!field.center.every(Number.isFinite))throw Error('Verified stadium infield missing')
 return {
  roadId:'area:east-stadium',areaId:field.id,name:'东田径场 · 自由驾驶',
  spawn:[field.center[0],BASE+1.3,field.center[1]],heading:0,
  elevation:'unmeasured-flat-campus-terrain'
 }
}
