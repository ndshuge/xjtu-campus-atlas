import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {labelTexture} from '../../architecture-kit.js';

export const WEST13_DORM_ID=264106086;
const SIGN='留学生公寓';

// The official International Education School image explicitly identifies
// this building as West No. 13. Its capture date and compass bearing are not
// published. This is a reversible 13 m entrance slice; the rest of the
// building remains in the original campus geometry.
export function createWest13EntranceAsset({
 building,buildingIndex,baseY=1.1,uniforms={},stage='material',
 entranceSide='north'
}={}){
 if(building?.osmId!==WEST13_DORM_ID)throw Error('West13 entrance requires OSM way/264106086');
 if(!['north','south'].includes(entranceSide))throw Error('West13 entrance side must be north or south');
 const minX=Math.min(...building.points.map(p=>p[0]));
 const maxX=Math.max(...building.points.map(p=>p[0]));
 const zs=building.points.map(p=>p[1]);
 const front=entranceSide==='south'?Math.max(...zs):Math.min(...zs);
 const outward=entranceSide==='south'?1:-1;
 const cx=(minX+maxX)/2, width=13.4, top=11.6;
 const b=ownedArchitecture('West No.13 / photographed international student dorm entrance',{
  baseY,stage,uniforms,stoneTileScale:2.4,stoneTileOptions:{jointWidth:.035,jointContrast:.15},
  extraMaterials:{gold:new THREE.MeshStandardMaterial({color:'#c2a35e',roughness:.46,metalness:.42})}
 });
 if(!b.gray){
  b.materials.stone.color.set('#746f68');
  b.materials.frame.color.set('#b3b3a8');
  b.materials.dark.color.set('#393d3c');
  b.materials.glass.color.set('#52686d');
  b.materials.roof.color.set('#c2bdb3');
 }
 const at=o=>front+outward*o;
 if(b.gray){
  b.box('stone',cx,0,at(.1),width,7.1,.13,buildingIndex,building.height);
 }else{
  // A small photo-backed portico: warm stone piers, glass entry and white
  // shallow canopy. All elements sit outside the existing generic facade.
  b.box('dark',cx,.09,at(.10),width,top,.15,buildingIndex,building.height);
  b.box('glass',cx,.07,at(.26),9.3,3.6,.12,buildingIndex,building.height);
  for(let i=0;i<=4;i++){
   b.box('frame',cx-4.6+i*2.3,.08,at(.41),.18,3.56,.20,buildingIndex,building.height);
  }
  for(const x of [cx-width*.43,cx+width*.43])
   b.box('frame',x,.04,at(.43),.74,10.8,.74,buildingIndex,building.height);
  b.box('roof',cx,3.48,at(1.03),width+.7,.55,2.05,buildingIndex,building.height);
  b.box('frame',cx,3.05,at(.46),9.7,.19,.18,buildingIndex,building.height);
  // The reference image has grouped horizontal windows divided by lighter
  // vertical columns and AC units; counts/positions are only indicative.
  for(let row=0;row<2;row++){
   const y=4.45+row*3.0;
   b.box('glass',cx,y,at(.24),10.3,1.65,.12,buildingIndex,building.height);
   b.box('frame',cx,y+1.60,at(.42),10.4,.15,.15,buildingIndex,building.height);
   for(const x of [cx-5.0,cx-2.4,cx,cx+2.4,cx+5.0])
    b.box('frame',x,y,at(.38),.15,1.76,.14,buildingIndex,building.height);
  }
  b.box('stone',cx,9.80,at(.24),width,1.65,.16,buildingIndex,building.height);
  // Four exterior AC boxes are visible around the entrance glazing in the
  // official archival photograph. Positions are photo-guided, not surveyed.
  for(const yy of [5.2,8.45])for(const xx of [cx-4.45,cx+4.45]){
   b.box('frame',xx,yy,at(.65),.82,.54,.51,buildingIndex,building.height);
   b.box('dark',xx,yy+.18,at(.96),.57,.32,.045,buildingIndex,building.height);
  }
  // Gold text sits above the low lobby canopy, as pictured. The individual
  // characters are generated with Canvas on device, never a photo texture.
  b.box('gold',cx,5.72,at(.50),10.6,.11,.10,buildingIndex,building.height);
 }
 const asset=b.finish({
  owner:'west13-entrance-asset.js',osmId:WEST13_DORM_ID,
  signText:SIGN,photoObservedACUnits:4,entranceSide,sourceDataUnchanged:true,hostOriginalMustRemain:true,
  geometryBasis:'official West No.13 entrance photo; 13m reversible facade slice',
  evidenceUrl:'https://sie.xjtu.edu.cn/zxxx/zsgl/xnzs.htm',
  evidenceImageUrl:'https://sie.xjtu.edu.cn/__local/9/F2/33/1002A29783D59B4E3A0B51C18CF_2056DB4E_7A670.jpg?e=.jpg',
  photoCaptureDate:null,photoPublished:null,
  currentStateVerified:false,entranceBearingVerified:false,
  photoLicense:'viewing reference only; bitmap not embedded or redistributed',
  unknown:'2026 entrance condition, actual compass-facing facade, height, sign dimensions, other walls'
 });
 if(!b.gray&&typeof document!=='undefined'){
  const texture=labelTexture(SIGN,{width:768,height:136,
   background:'rgba(0,0,0,0)',color:'#dfba64'});
  if(texture){
   const sign=new THREE.Mesh(new THREE.PlaneGeometry(10.0,1.05),
    new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
   sign.position.set(cx,baseY+6.52,at(.62));
   sign.rotation.y=entranceSide==='south'?0:Math.PI;
   sign.name='West13 photo-backed gold dormitory inscription';
   sign.userData.buildingIndex=buildingIndex;sign.userData.owner='west13-entrance-asset.js';
   asset.add(sign);
   const release=asset.dispose;let done=false;
   asset.dispose=()=>{if(done)return;done=true;release();texture.dispose();};
  }
 }
 return asset;
}
