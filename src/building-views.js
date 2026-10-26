import * as THREE from 'three';
import {BASE,bounds,pointIn} from './geo.js';

export function libraryEntranceFrame(place,buildings,width,height){
 const mobile=width<=768,bb=bounds(place.points),cx=(bb[0]+bb[2])/2;
 // Existing near-view cameras sat above the mapped A/B connecting building.
 // Use an empty part of the square; adjust the lens to the model's south face.
 const x=cx+(mobile?0:14),z=[18,12,8,4,0,-6].find(z=>!buildings.some(b=>pointIn([x,z],b.points)));
 if(z===undefined)return buildingGroupFrame(place,buildings,width,height);
 const position=new THREE.Vector3(x,BASE+30,z),target=new THREE.Vector3(cx,BASE+(mobile?12:22),bb[3]-18);
 const direction=position.clone().sub(target).normalize(),right=new THREE.Vector3(0,1,0).cross(direction).normalize(),up=direction.clone().cross(right).normalize();
 const frontBounds=[cx-42.7,bb[3]-39,cx+42.7,bb[3]+8],top=49.75,marginX=mobile?.92:.54,marginY=.70;
 let tanFov=0;
 for(const xx of [frontBounds[0],frontBounds[2]])for(const zz of [frontBounds[1],frontBounds[3]])for(const yy of [BASE,BASE+top]){
  const q=new THREE.Vector3(xx,yy,zz).sub(position),depth=-q.dot(direction);
  tanFov=Math.max(tanFov,Math.abs(q.dot(right))/(depth*width/height*marginX),Math.abs(q.dot(up))/(depth*marginY));
 }
 return{position:position.toArray(),target:target.toArray(),fov:Math.max(45,2*Math.atan(tanFov)*180/Math.PI+1),bounds:frontBounds,top,marginX,marginY,status:'Elevated square viewpoint; lens fits the existing approximate south mass'};
}

// Frame actual mapped footprints and heights, rather than a fixed camera
// distance that clips long compounds in a portrait viewport.
export function buildingGroupFrame(place,buildings,width,height){
 if(!place?.points)return null;
 const mobile=width<=768;
 const members=place.osmId===263624057?buildings.filter(b=>/^主楼[A-E]座$/.test(b.name)&&Math.hypot(b.center[0]-place.center[0],b.center[1]-place.center[1])<240):[place];
 const bb=bounds(members.flatMap(b=>b.points)),top=Math.max(...members.map(b=>b.displayHeight||b.height));
 const center=new THREE.Vector3((bb[0]+bb[2])/2,BASE+top*.38,(bb[1]+bb[3])/2);
 const direction=new THREE.Vector3(...(place.osmId===263624481?[-.65,.95,-1]:place.osmId===263632364?[-1,.85,.45]:[.75,.95,1])).normalize();
 const right=new THREE.Vector3(0,1,0).cross(direction).normalize(),up=direction.clone().cross(right).normalize();
 const fov=mobile?65:45,tanV=Math.tan(fov*Math.PI/360),tanH=tanV*width/height;
 const marginX=mobile?.82:.68,marginY=mobile?.64:.76;
 let distance=120;
 for(const x of [bb[0],bb[2]])for(const z of [bb[1],bb[3]])for(const y of [BASE,BASE+top]){
  const q=new THREE.Vector3(x,y,z).sub(center),depth=q.dot(direction);
  distance=Math.max(distance,depth+Math.abs(q.dot(right))/(tanH*marginX),depth+Math.abs(q.dot(up))/(tanV*marginY));
 }
 const position=center.clone().addScaledVector(direction,distance+10);
 return{position:position.toArray(),target:center.toArray(),fov,bounds:bb,top,marginX,marginY,ids:members.map(b=>b.id),status:'Framing mapped volumes; estimated model heights are not a site survey'};
}
