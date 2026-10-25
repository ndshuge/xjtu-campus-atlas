import {pointIn,pointSegment} from './geo.js';

// Choose a walkable eye position without relying on the visual mesh or GPU.
// The geometry is approximate; this is a clearance check, not a surveyed route.
export function findSafeWalkStart({
  desired,target,roads,boundaries,buildings,water=[],trees=[],obstacles=[],
  buildingClearance=2.2,canBlock=null
}){
 const d2=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const isBlocked=canBlock||((p,margin)=>{
   for(const b of buildings){if(pointIn(p,b.points))return true;
     for(let i=1;i<b.points.length;i++)if(pointSegment(p,b.points[i-1],b.points[i]).distance<margin)return true;
   }return false;
 });
 const inside=p=>boundaries.some(b=>pointIn(p,b));
 const safe=(p,extra=0)=>{
   if(!inside(p)||isBlocked(p,buildingClearance+extra))return false;
   if(water.some(w=>pointIn(p,w.points)))return false;
   if(obstacles.some(o=>d2(p,[o.x,o.z])<o.radius+1.4+extra))return false;
   return !trees.some(t=>d2(p,[t.x,t.z])<Math.max(1.6,(t.r||3)*.85+extra));
 };
 const viewClear=p=>{
   // Keep the first camera view away from the undersides of nearby crowns.
   if(trees.some(t=>d2(p,[t.x,t.z])<(t.r||3)+3.8))return false;
   // Keep a clear initial corridor to the target, not just an empty spawn spot.
   if(!target)return true;
   const len=d2(p,target);
   if(len<32)return false;
   // Occluding neighboring buildings must not sit between camera and facade.
   // Skip the last few metres, where the target building itself begins.
   for(let distance=4;distance<len-9;distance+=3.5){
     const q=[p[0]+(target[0]-p[0])*distance/len,p[1]+(target[1]-p[1])*distance/len];
     if(isBlocked(q,1.7))return false;
   }
   for(const t of trees){
     const q=pointSegment([t.x,t.z],p,target);
     if(q.distance<(t.r||3)*.73 && d2(q.point,p)<Math.min(len*.8,42))return false;
   }
   return true;
 };
 const candidates=[];
 const put=(p,type)=>{if(d2(p,desired)<=110&&safe(p)&&viewClear(p))candidates.push({p,type,cost:d2(p,desired)})};
 put(desired,'desired');
 // Walkable plaza grid first: the OSM network doesn't describe every courtyard.
 for(let radius=5;radius<=85;radius+=5)for(let i=0;i<24;i++){
   const a=2*Math.PI*i/24;
   put([desired[0]+Math.cos(a)*radius,desired[1]+Math.sin(a)*radius],'courtyard');
 }
 // Roads may be missing near the front of a building. Check their actual
 // centerlines only as fallback, and require a non-occluded sightline.
 for(const road of roads.filter(r=>r.campus)){
   for(let i=1;i<road.points.length;i++){
     const a=road.points[i-1],b=road.points[i],len=d2(a,b);
     if(Math.min(d2(a,desired),d2(b,desired))>len+110)continue;
     const q=pointSegment(desired,a,b).point;
     put(q,'road');
     for(let k=0;k<=len;k+=8)put([a[0]+(b[0]-a[0])*k/Math.max(1,len),a[1]+(b[1]-a[1])*k/Math.max(1,len)],'road');
   }
 }
 if(candidates.length){
   candidates.sort((a,b)=>a.cost-b.cost||(a.type==='desired'?-1:1));
   return {...candidates[0],fallback:false};
 }
 // If exact view corridors are unavailable, never place the user inside
 // geometry: permit covered locations but maintain building/obstacle clearance.
 const covered=[];
 for(let r=0;r<=110;r+=5)for(let k=0;k<24;k++){
  const a=2*Math.PI*k/24,p=[desired[0]+r*Math.cos(a),desired[1]+r*Math.sin(a)];
  if(safe(p))covered.push({p,cost:d2(p,desired),type:'covered',fallback:true});
 }
 covered.sort((a,b)=>a.cost-b.cost);
 return covered[0]||null;
}
