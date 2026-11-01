// R26: close-up framing for a selected OSM building.
// Pure math; it never moves the camera or edits OSM, and does not alter overview framing.
const finite2=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)
export function planBuildingCloseView({building,currentEye,viewport={width:1440,height:900},baseY=1.1}={}){
 if(!building||!finite2(building.center)||!Array.isArray(building.points)||building.points.length<3||
  !building.points.every(finite2)||!Array.isArray(currentEye)||currentEye.length!==3||
  !currentEye.every(Number.isFinite)||!Number.isFinite(baseY))return null
 const xs=building.points.map(p=>p[0]),zs=building.points.map(p=>p[1])
 const width=Math.max(...xs)-Math.min(...xs),depth=Math.max(...zs)-Math.min(...zs)
 const height=Number.isFinite(building.displayHeight)&&building.displayHeight>1?building.displayHeight:
  Number.isFinite(building.height)&&building.height>1?building.height:14
 if(!(width>0&&depth>0))return null
 const narrow=viewport.width/Math.max(1,viewport.height)<.75
 // The close-up is deliberately allowed to crop edges of a large compound:
 // users asked to inspect facades, not repeat the 200m overview shot.
 const footprintDistance=Math.max(width,depth)*(narrow?1.10:.82)+14
 const distance=Math.min(132,Math.max(48,footprintDistance,height*2.9))
 const dx=currentEye[0]-building.center[0],dz=currentEye[2]-building.center[1]
 const len=Math.hypot(dx,dz),nx=len>.01?dx/len:Math.SQRT1_2,nz=len>.01?dz/len:Math.SQRT1_2
 const vertical=distance*.32,horizontal=Math.sqrt(distance*distance-vertical*vertical)
 const target=[building.center[0],baseY+height*.42,building.center[1]]
 const position=[target[0]+nx*horizontal,target[1]+vertical,target[2]+nz*horizontal]
 return {position,target,distance,footprint:[width,depth],height,coverage:narrow?'portrait-cropped-detail':'close-facade'}
}
