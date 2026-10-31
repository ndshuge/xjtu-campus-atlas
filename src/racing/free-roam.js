import {BASE} from '../geo.js'
import {findStadiumInfield} from '../stadium-infield.js'

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
