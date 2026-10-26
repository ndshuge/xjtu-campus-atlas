import {pointSegment} from './geo.js';

export const LIBRARY_LEVELS=Object.freeze({baseHeight:13,north:4,stack:5,assumedStoreyHeight:3.5});
export const LIBRARY_MASSING_SOURCE='https://news.xjtu.edu.cn/info/1219/153497.htm';

// The four seams are vertices of the existing OSM footprint, matched to the
// U-shaped north reading block and T-shaped stack in the licensed 2025 aerial.
// They are NOT surveyed elevations or points digitised from a photograph.
const SEAMS={rightJunction:[-23.241,-196.551],rightStackEnd:[-23.066,-160.189],leftStackEnd:[-36.681,-159.846],leftJunction:[-36.856,-196.207]};
export function libraryMassingPlan(footprint){
 const index=Object.fromEntries(Object.entries(SEAMS).map(([name,q])=>[name,footprint.findIndex(p=>Math.hypot(p[0]-q[0],p[1]-q[1])<.5)]));
 const {rightJunction:r,rightStackEnd:rt,leftStackEnd:lt,leftJunction:l}=index;
 if(!(r>0&&rt>r&&lt>rt&&l>lt))return null; // Changed OSM topology requires re-review.
 const north=[...footprint.slice(0,r+1),...footprint.slice(l)];
 const stack=[...footprint.slice(r,rt+1),...footprint.slice(lt,l+1),footprint[r]];
 const roofWing=(id,a,b)=>{
  const start=footprint.findIndex(p=>Math.hypot(p[0]-a[0],p[1]-a[1])<.5),end=footprint.findIndex(p=>Math.hypot(p[0]-b[0],p[1]-b[1])<.5);
  return start>=0&&end>start?{id,points:[...footprint.slice(start,end+1),footprint[start]]}:null;
 };
 const southRoofWings=[roofWing('south-east-wing',[-22.891,-140.988],[-23.416,-130.006]),roofWing('south-west-wing',[-36.856,-130.35],[-36.856,-141.321])].filter(Boolean);
 return {baseHeight:LIBRARY_LEVELS.baseHeight,zones:[
  {id:'north-reading-block',points:north,levels:4,height:14,roof:'#a7a69d'},
  {id:'north-book-stack',points:stack,levels:5,height:17.5,roof:'#9b9c93'}
 ],southRoofWings,source:LIBRARY_MASSING_SOURCE,photograph:'Liuxingy / 2025-07-25 / CC BY-SA 4.0',
 status:'Published floor counts; OSM/photo-matched plan segmentation; 3.5m storeys are approximate, not a survey'};
}

export function libraryEdgeProfile(plan,a,b){
 const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
 for(const zone of plan?.zones||[])for(let i=1;i<zone.points.length;i++){
  if(pointSegment(mid,zone.points[i-1],zone.points[i]).distance<.025)return zone;
 }
 return {levels:3,height:13,id:'retained-south-base'};
}
