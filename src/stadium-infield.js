// R17 stadium: the documented OSM soccer pitch is a hole in the running-track
// surface. Never draw red and green coplanar triangles over one another.
import {flat,pointIn} from './geo.js';

export function findStadiumInfield(stadium,surfaces){
 if(!stadium||stadium.name!=='东田径场'||!stadium.points?.length)return null;
 const candidates=surfaces.filter(candidate=>candidate!==stadium&&candidate.kind==='pitch'
  &&candidate.sport==='soccer'&&candidate.points?.length>=4
  &&candidate.points.every(p=>pointIn(p,stadium.points)));
 // The pitch name is not reliable in OSM, containment and sport are.
 return candidates.length===1?candidates[0]:null;
}
export function createStadiumTrackGeometry(stadium,surfaces,height){
 const inner=findStadiumInfield(stadium,surfaces);
 return flat(stadium.points,height,inner?[inner.points]:[]);
}

/**
 * Photograph-informed athletics geometry using only the documented OSM outer
 * stadium enclosure and the independently mapped soccer field as anchors.
 * Widths/lane count are illustrative, not measured lane geometry.
 */
import {bounds} from './geo.js';
function ovalOutline(cx,low,high,r,steps=40){
 const pts=[[cx+r,low],[cx+r,high]];
 for(let i=1;i<=steps;i++){const t=i/steps*Math.PI;pts.push([cx+r*Math.cos(t),high+r*Math.sin(t)]);}
 pts.push([cx-r,low]);
 for(let i=1;i<=steps;i++){const t=Math.PI+i/steps*Math.PI;pts.push([cx+r*Math.cos(t),low+r*Math.sin(t)]);}
 return pts;
}
export function planAthleticsStadium(stadium,surfaces){
 const infield=findStadiumInfield(stadium,surfaces);
 if(!infield)throw new Error('Verified stadium soccer surface required');
 const [sx0,sz0,sx1,sz1]=bounds(stadium.points);
 const [fx0,fz0,fx1,fz1]=bounds(infield.points);
 const centerX=(fx0+fx1)/2,centerZ=(fz0+fz1)/2;
 const innerRadius=(fx1-fx0)/2+4;
 const outerRadius=innerRadius+9;
 const south=fz0+13,north=fz1-13;
 if(south>=north||centerX-outerRadius<sx0+2||
  centerX+outerRadius>sx1-2||south-outerRadius<sz0+2||
  north+outerRadius>sz1-2)throw Error('Cannot place athletics oval inside mapped OSM enclosure');
 return {
  stadiumId:stadium.id,infieldId:infield.id,
  centerX,centerZ,innerRadius,outerRadius,south,north,
  inner:ovalOutline(centerX,south,north,innerRadius),
  outer:ovalOutline(centerX,south,north,outerRadius)
 };
}
export function createAthleticsTrackGeometry(stadium,surfaces,height){
 const plan=planAthleticsStadium(stadium,surfaces);
 return flat(plan.outer,height,[plan.inner]);
}
export function createAthleticsLaneLines(stadium,surfaces,y,lanes=6){
 const plan=planAthleticsStadium(stadium,surfaces);
 const segments=[];
 for(let k=0;k<=lanes;k++){
  const radius=plan.innerRadius+(.3+(plan.outerRadius-plan.innerRadius-.6)*k/lanes);
  const outline=ovalOutline(plan.centerX,plan.south,plan.north,radius,52);
  for(let i=1;i<outline.length;i++){
   const [ax,az]=outline[i-1],[bx,bz]=outline[i];
   segments.push(ax,y,az,bx,y,bz);
  }
  const [ax,az]=outline.at(-1),[bx,bz]=outline[0];segments.push(ax,y,az,bx,y,bz)
 }
 return new Float32Array(segments);
}
