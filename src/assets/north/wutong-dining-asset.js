import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {labelTexture} from '../../architecture-kit.js';

export const WUTONG_DINING_ID=264106085;

// 2014 university opening photos document pale fine tile, projecting
// entrance eaves, a dark glazed entrance, and a glazed upper corner.
// They DO NOT establish the exact compass-facing entrance or 2026 facade.
// Restrict interpretation to the east long face and keep other walls plain.
export function createWutongDiningAsset({
 building,buildingIndex,baseY=1.1,uniforms={},stage='material'
}={}){
 if(building?.osmId!==WUTONG_DINING_ID)throw Error('Wutong dining hall requires OSM 264106085');
 const height=building.height; // OSM 18m estimate, 3 storeys official in 2014
 const a=ownedArchitecture('Wutongyuan cafeteria / 2014 photo-backed facade',{
  baseY,uniforms,stage,stoneTileScale:2.85,
  stoneTileOptions:{jointWidth:.028,jointContrast:.16}
 });
 if(!a.gray){
  a.materials.stone.color.set('#c4c8c6');
  a.materials.frame.color.set('#d1d4d0');
  a.materials.glass.color.set('#425c65');
  a.materials.dark.color.set('#404a4d');
  a.materials.roof.color.set('#a9adaa');
 }
 const {edges}=a.shell(building.points,{
  top:height,rows:3,index:buildingIndex,height,bayWidth:4.6,
  face:e=>e.nx>.8&&e.length>37
 });
 const front=edges.find(e=>e.nx>.8&&e.length>37);
 if(!front)throw Error('Wutong mapped east long face is absent');
 const L=front.length;
 const at=(s,y,offset=0)=>[
  front.a[0]+front.ux*s+front.nx*offset,
  baseY+y,
  front.a[1]+front.uz*s+front.nz*offset
 ];
 if(a.gray){
  a.plane('stone',front,0,L,0,height,buildingIndex,height);
 }else{
  // Ground-floor entrance: glazed wall and clearly recessed glass doors
  // under a thin steel/stone canopy, against the original gray tile.
  const entryA=L*.10,entryB=L*.69;
  const groundTop=height*.325;
  a.plane('stone',front,0,entryA,0,groundTop,buildingIndex,height);
  a.plane('stone',front,entryB,L,0,groundTop,buildingIndex,height);
  a.plane('glass',front,entryA,entryB,.10,groundTop-.14,buildingIndex,height,-.18);
  for(let i=0;i<=9;i++){
   const s=entryA+(entryB-entryA)*i/9;
   a.plane('dark',front,s-.06,s+.06,.12,groundTop-.12,buildingIndex,height,.07);
  }
  a.plane('dark',front,entryA,entryB,2.80,2.93,buildingIndex,height,.07);
  a.plane('stone',front,entryA,entryB,groundTop-.17,groundTop,buildingIndex,height,.09);
  // Entire entrance eave is shallow; OSM building shape unchanged.
  const center=(entryA+entryB)/2;
  a.box('frame',front.a[0]+front.ux*center+front.nx*.95,groundTop-.18,
   front.a[1]+front.uz*center+front.nz*.95,1.90,.29,entryB-entryA+1.2,buildingIndex,height);
  // Upper storeys: official photo shows a dark continuous corner glazing
  // band, not generic repeated small square windows.
  const bandFrom=L*.53,bandTo=L*.975;
  for(const [lo,hi] of [[height*.38,height*.575],[height*.70,height*.88]]){
   a.plane('stone',front,0,bandFrom,lo,hi,buildingIndex,height);
   a.plane('stone',front,bandTo,L,lo,hi,buildingIndex,height);
   a.plane('glass',front,bandFrom,bandTo,lo,hi,buildingIndex,height,-.08);
   const n=Math.max(5,Math.floor((bandTo-bandFrom)/3.5));
   for(let i=0;i<=n;i++){
    const s=bandFrom+(bandTo-bandFrom)*i/n;
    a.plane('dark',front,s-.047,s+.047,lo,hi,buildingIndex,height,.03);
   }
   a.plane('dark',front,bandFrom,bandTo,lo-.055,lo+.035,buildingIndex,height,.03);
   a.plane('dark',front,bandFrom,bandTo,hi-.035,hi+.055,buildingIndex,height,.03);
  }
  for(const [lo,hi] of [[groundTop,height*.38],[height*.575,height*.70],[height*.88,height]])
   a.plane('stone',front,0,L,lo,hi,buildingIndex,height);
 }
 const asset=a.finish({
  owner:'wutong-dining-asset.js',
  osmIds:[WUTONG_DINING_ID],
  photographedStoreys:3,sourceDataUnchanged:true,currentStateVerified:false,
  entranceOrientationVerified:false,photoCaptureDate:null,
  photoPeriod:'2014 university opening photos, not 2026 facade survey',
  evidenceUrl:'https://news.xjtu.edu.cn/info/1002/56640.htm',
  evidenceImages:[
   'https://news.xjtu.edu.cn/_mediafile/newss/2014/09/06/16y9el3jwx.jpg',
   'https://news.xjtu.edu.cn/_mediafile/newss/2014/09/06/2ptxxpxjx2.jpg'
  ],
  photoLicense:'reference only; no school photograph copied into models',
  facadeFacing:'east long side (UNVERIFIED orientation)',
  unknown:'exact entrance compass, roofline, side walls, 2026 exterior after repair, storey heights'
 });
 if(!a.gray){
  const txt=labelTexture('梧桐苑',{width:768,height:220,
   color:'#344638',background:'rgba(0,0,0,0)'});
  if(txt){
   const s=L*.345,sign=new THREE.Mesh(new THREE.PlaneGeometry(L*.35,1.65),
    new THREE.MeshBasicMaterial({map:txt,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
   sign.name='Wutongyuan entrance name / generated lettering';
   sign.position.set(...at(s,height*.395,.27));
   sign.rotation.y=Math.atan2(front.nx,front.nz);
   sign.userData.buildingIndex=buildingIndex;sign.userData.owner='wutong-dining-asset.js';
   asset.add(sign);
   const prev=asset.dispose;let done=false;
   asset.dispose=()=>{if(done)return;done=true;prev();txt.dispose();};
  }
 }
 return asset;
}
