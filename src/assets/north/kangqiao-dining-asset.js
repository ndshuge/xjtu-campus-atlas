import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {labelTexture} from '../../architecture-kit.js';
import {planCells,cellBoundary} from '../../library-asset-plan.js';

export const KANGQIAO_DINING_ID=263625679;

/**
 * Photo-bounded Kangqiao Dining Hall exterior, NOT a survey.
 * Historic exterior photo: https://sucai.redocn.com/jianzhu_11680305.html
 * Licensed 2021-09-07 catalog image (capture date unknown) shows a
 * pale stone facade, distinct entrance mass, and horizontal windows.
 * Actual photographed wall compass orientation and construction dates unknown.
 */
export function createKangqiaoDiningAsset({
 building,buildingIndex,baseY=1.1,uniforms={},stage='material'
}={}){
 if(building?.osmId!==KANGQIAO_DINING_ID)
  throw Error('Kangqiao dining hall requires OSM way/263625679');
 const height=building.height;
 const a=ownedArchitecture('Kangqiao dining hall / two facade wings',{
  baseY,uniforms,stage,stoneTileScale:2.3,
  stoneTileOptions:{jointWidth:.026,jointContrast:.12}
 });
 if(!a.gray){
  a.materials.stone.color.set('#c6c4ba');
  a.materials.glass.color.set('#566a69');
  a.materials.frame.color.set('#a8aba5');
  a.materials.dark.color.set('#333f42');
  a.materials.roof.color.set('#aaa99d');
 }
 // West long face: direction is only an OSM-based assumption, not geolocated
 // to the photo. The other three elevations remain conservative.
 const cells=planCells(building.points),edges=cellBoundary(cells);
 for(const e of edges)if(!(e.nx<-.8&&e.length>70))
  a.wall(e,{top:height,rows:4,index:buildingIndex,height,bayWidth:4.2});
 // In massing mode keep the surveyed OSM roof cap. The material stage
 // instead uses sloped full-depth roof panels to avoid overlapping planes
 // and mobile-GPU depth artifacts from a second flat roof.
 if(a.gray)a.roof(cells,height,buildingIndex,height);
 const front=edges.find(e=>e.nx<-.8&&e.length>70);
 if(!front)throw Error('Kangqiao footprint expected a west long facade');
 const L=front.length,pavEnd=L*.405;
 const at=(s,y,o=0)=>[
  front.a[0]+front.ux*s+front.nx*o,
  baseY+y,
  front.a[1]+front.uz*s+front.nz*o
 ];
 const roofSurface=([p0,p1,p2,p3])=>
  a.quad('roof',[p0,p3,p2,p1],buildingIndex,height);
 if(a.gray){
  a.plane('stone',front,0,L,0,height,buildingIndex,height);
 }else{
  // Left gabled building in the photographed view.
  const entryA=L*.21,entryB=L*.38,lobbyTop=height*.42;
  a.plane('stone',front,0,pavEnd,lobbyTop,height,buildingIndex,height);
  a.plane('stone',front,0,entryA,0,lobbyTop,buildingIndex,height);
  a.plane('stone',front,entryB,pavEnd,0,lobbyTop,buildingIndex,height);
  a.plane('dark',front,entryA,entryB,.05,lobbyTop,buildingIndex,height,-.23);
  a.curtain(front,{from:entryA+.35,to:entryB-.35,bottom:.08,top:lobbyTop-.5,
   index:buildingIndex,height,columns:6,rows:3});
  // Side columns are kept wide enough to read in the driving-distance view.
  for(const s of [entryA,entryB])
   a.plane('stone',front,s-.2,s+.2,0,lobbyTop,buildingIndex,height,.12);
  a.plane('stone',front,entryA,entryB,lobbyTop-.48,lobbyTop,buildingIndex,height,.12);
  // Photo left has a prominent gable over the entry pavilion. The profile
  // is treated as a shallow masonry parapet over the flat OSM cap.
  const apex=L*.19,gableY=height+2.7,roofDepth=52.6;
  a.quad('stone',[
   at(0,height,.035),at(apex,gableY,.035),at(pavEnd,height,.035),at(pavEnd,height,.035)
  ],buildingIndex,height);
  roofSurface([
   at(0,height,.01),at(apex,gableY,.01),at(apex,gableY,-roofDepth),at(0,height,-roofDepth)
  ]);
  roofSurface([
   at(apex,gableY,.01),at(pavEnd,height,.01),
   at(pavEnd,height,-roofDepth),at(apex,gableY,-roofDepth)
  ]);

  roofSurface([
   at(apex-.16,gableY+.025,.01),at(apex+.16,gableY+.025,.01),
   at(apex+.16,gableY+.025,-roofDepth),at(apex-.16,gableY+.025,-roofDepth)
  ]);

  // Finish the wide, flatter dining wing without restoring the coplanar
  // full-footprint roof that caused mobile-visible z-fighting.
  // This rectangle shares only its boundary with the gabled pavilion.
  roofSurface([
   at(pavEnd,height+.025,.01),at(L,height+.025,.01),
   at(L,height+.025,-roofDepth),at(pavEnd,height+.025,-roofDepth)
  ]);

  // Right wing: broad paired horizontal window bands, visibly different
  // from the unrelated dormitory checkerboard pattern.
  const wingA=pavEnd,wingB=L*.98;
  // Break the long shallow roof into four joined, batched planar panels.
  // This avoids one oversized trapezoid and retains a complete weather cap
  // across the observed wing without double-rendering a flat roof.
  const wingRoofHeight=s=>height+.03+1.13*(s-wingA)/(L-wingA);
  for(let section=0;section<4;section++){
   const s0=wingA+(L-wingA)*section/4,s1=wingA+(L-wingA)*(section+1)/4;
   roofSurface([
    at(s0,wingRoofHeight(s0),.01),at(s1,wingRoofHeight(s1),.01),
    at(s1,wingRoofHeight(s1),-roofDepth),at(s0,wingRoofHeight(s0),-roofDepth)
   ]);
  }
  for(const [lo,hi] of [[height*.29,height*.43],[height*.65,height*.79]]){
   a.plane('glass',front,wingA+.48,wingB-.55,lo,hi,buildingIndex,height,-.07);
   for(const s of [wingA+.48,wingB-.55])
    a.plane('frame',front,s-.13,s+.13,lo,hi,buildingIndex,height,.035);
   // Seams/vertical mullions batch, do not create per-pane meshes.
   const bays=Math.max(6,Math.floor((wingB-wingA)/4.6));
   for(let i=1;i<bays;i++){
    const s=wingA+(wingB-wingA)*i/bays;
    a.plane('frame',front,s-.045,s+.045,lo,hi,buildingIndex,height,.04);
   }
   a.plane('frame',front,wingA+.48,wingB-.55,lo-.11,lo+.07,buildingIndex,height,.04);
   a.plane('frame',front,wingA+.48,wingB-.55,hi-.07,hi+.1,buildingIndex,height,.04);
  }
  for(const [lo,hi] of [[0,height*.29],[height*.43,height*.65],[height*.79,height]])
   a.plane('stone',front,wingA, L,lo,hi,buildingIndex,height);
  a.plane('stone',front,wingA,wingA+.48,height*.29,height*.43,buildingIndex,height);
  a.plane('stone',front,wingB-.55,L,height*.29,height*.43,buildingIndex,height);
  a.plane('stone',front,wingA,wingA+.48,height*.65,height*.79,buildingIndex,height);
  a.plane('stone',front,wingB-.55,L,height*.65,height*.79,buildingIndex,height);
  // Sloping upper line of the photographed glass wing, only a short raised
  // parapet; source polygon and full roof below remain unchanged.
  a.quad('stone',[
   at(wingA,height,.025),at(wingB,height+1.15,.025),
   at(wingB,height,.025),at(wingA,height,.025)
  ],buildingIndex,height);
 }
 const asset=a.finish({
  owner:'kangqiao-dining-asset.js',osmIds:[KANGQIAO_DINING_ID],
  sourceDataUnchanged:true,structuralWings:2,photoDate:null,
  evidenceUrl:'https://sucai.redocn.com/jianzhu_11680305.html',
  confirmationUrl:'https://www.cfsn.cn/news/detail/704/264888.html?view=pc',
  currentStateVerified:false,entranceOrientationVerified:false,
  sourcePhotoType:'licensed stock-photo reference; listed 2021-09-07, capture date unknown; no image reused',
  facadeFacing:'west long OSM side (assumption)',
  unknown:'photo capture date, current entrance direction, roof dimensions, 2026 exterior and rear facade'
 });
 if(!a.gray){
  const tx=labelTexture('康桥苑',{width:512,height:128,
   background:'rgba(0,0,0,0)',color:'#5a564b'});
  if(tx){
   const s=L*.103;
   const sign=new THREE.Mesh(new THREE.PlaneGeometry(L*.125,.70),
    new THREE.MeshBasicMaterial({map:tx,transparent:true,
     depthWrite:false,side:THREE.DoubleSide}));
   sign.name='Kangqiao sign / generated glyphs';
   sign.position.set(...at(s,height*.38,.16));
   sign.rotation.y=Math.atan2(front.nx,front.nz);
   sign.userData.buildingIndex=buildingIndex;sign.userData.owner='kangqiao-dining-asset.js';
   asset.add(sign);
   const dispose=asset.dispose;
   let done=false;asset.dispose=()=>{if(done)return;done=true;dispose();tx.dispose();};
  }
 }
 return asset;
}
