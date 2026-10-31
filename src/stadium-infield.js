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
