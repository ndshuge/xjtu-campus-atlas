import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {labelTexture} from '../../architecture-kit.js';

export const NANYANG_EAST9_ID=263808680;

// Photo: xjtu.party/photos -> "East 9 dormitory", an older school entrance.
// The photographed two-storey glazed lobby and vertical Nanyang plaque are
// distinctive. Front compass direction, dimensions and 2026 status are unknown.
export function createNanyangEast9Asset({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 if(building?.osmId!==NANYANG_EAST9_ID)throw Error('Nanyang East 9 requires OSM way/263808680');
 const height=building.height;
 const batch=ownedArchitecture('Nanyang East 9 / glazed entrance hall',{
  baseY,uniforms,stage,stoneTileScale:3.05,
  stoneTileOptions:{jointWidth:.034,jointContrast:.12},
  extraMaterials:{plaque:new THREE.MeshStandardMaterial({color:'#b67f36',roughness:.65,metalness:.08})}
 });
 if(!batch.gray){
  batch.materials.stone.color.set('#d8dcd8');
  batch.materials.glass.color.set('#52686a');
  batch.materials.frame.color.set('#a3a9a7');
  batch.materials.dark.color.set('#424d52');
  batch.materials.roof.color.set('#a7aaa5');
 }
 const {edges}=batch.shell(building.points,{top:height,rows:6,index:buildingIndex,height,
  bayWidth:3.1,face:e=>e.nz<-.85&&e.length>45});
 const front=edges.find(e=>e.nz<-.85&&e.length>45);
 if(!front)throw Error('East 9 expected north-facing long OSM edge missing');
 const L=front.length,entryMiddle=L*.60,entranceWidth=12.5;
 const left=entryMiddle-entranceWidth/2,right=entryMiddle+entranceWidth/2;
 const entranceTop=7.25,rows=6,floor=height/rows;
 if(batch.gray){
  batch.plane('stone',front,0,L,0,height,buildingIndex,height);
 }else{
  // Pictured masonry and windows are reconstructed independently of East 8.
  // The 2-storey entrance replaces, rather than overlays, a generic wall.
  const count=Math.floor(L/3.1),bay=L/count;
  for(let row=0;row<rows;row++){
   const bottom=row*floor,lo=bottom+floor*.28,hi=bottom+floor*.76;
   for(let col=0;col<count;col++){
    const start=col*bay,end=(col+1)*bay;
    const a=start+bay*.12,b=end-bay*.12;
    if(row<2&&end>left&&start<right){
     const partA=Math.min(end,left),partB=Math.max(start,right);
     if(partA>start)batch.plane('stone',front,start,partA,bottom,bottom+floor,buildingIndex,height);
     if(end>partB)batch.plane('stone',front,partB,end,bottom,bottom+floor,buildingIndex,height);
     continue;
    }
    batch.plane('stone',front,start,end,bottom,lo,buildingIndex,height);
    batch.plane('stone',front,start,end,hi,bottom+floor,buildingIndex,height);
    batch.plane('stone',front,start,a,lo,hi,buildingIndex,height);
    batch.plane('stone',front,b,end,lo,hi,buildingIndex,height);
    batch.plane('glass',front,a,b,lo,hi,buildingIndex,height,-.07);
    for(const s of [a,b,a+(b-a)*.51])batch.plane('frame',front,s-.036,s+.036,lo,hi,buildingIndex,height,.025);
   }
  }
  // Join the end bays to the glass hall without a second opaque wall.
  batch.plane('stone',front,left-.38,left,0,entranceTop,buildingIndex,height,.04);
  batch.plane('stone',front,right,right+.38,0,entranceTop,buildingIndex,height,.04);
  batch.curtain(front,{from:left,to:right,bottom:.12,top:entranceTop,index:buildingIndex,
   height,columns:7,rows:3});
  // Broad aluminium fascia separating ground entrance and mezzanine glazing.
  batch.plane('frame',front,left,right,3.17,3.48,buildingIndex,height,.15);
  batch.plane('dark',front,left,right,entranceTop-.29,entranceTop,buildingIndex,height,.1);
  // Curved interior mezzanine rail, visible through the upper glass.
  // This follows the historical photograph only qualitatively (unmeasured).
  const at=(s,y,depth)=>[
   front.a[0]+front.ux*s+front.nx*depth,baseY+y,
   front.a[1]+front.uz*s+front.nz*depth
  ];
  for(let i=0;i<12;i++){
   const s0=left+.8+(right-left-1.6)*i/12;
   const s1=left+.8+(right-left-1.6)*(i+1)/12;
   const curve0=.55+1.0*Math.sin(Math.PI*i/12);
   const curve1=.55+1.0*Math.sin(Math.PI*(i+1)/12);
   batch.quad('frame',[at(s0,4.13,-curve0),at(s0,4.26,-curve0),
     at(s1,4.26,-curve1),at(s1,4.13,-curve1)],buildingIndex,height);
  }
  // Tall bronze plaque appears at image-right in the historical photo.
  // Local OSM edge winding reverses the viewer-right direction (lower s).
  const plFrom=Math.max(.25,left-1.62),plTo=left-.13;
  batch.plane('plaque',front,plFrom,plTo,.56,6.45,buildingIndex,height,.16);
  batch.plane('dark',front,plFrom+.10,plTo-.10,.69,6.31,buildingIndex,height,.185);
  // Shallow shopfront glazing at the door; no third-party photo texturing.
  batch.plane('frame',front,left+.58,right-.58,.2,.38,buildingIndex,height,.12);
 }
 const asset=batch.finish({owner:'nanyang-east9-asset.js',osmIds:[NANYANG_EAST9_ID],
  sourceDataUnchanged:true,currentStateVerified:false,entranceOrientationVerified:false,
  photograph:'https://xjtu.party/photos',photoDate:null,licensedTextureUsed:false,
  photoFeatures:['two-storey glazed entrance','curved interior mezzanine rail',
   'pale square tiles','bronze vertical Nanyang plaque'],
  entranceHeightApprox:entranceTop,entryPlacement:'north long face, estimated',
  unknown:'Current entrance orientation and glass retrofit, actual floor heights, roof/other elevations, signage in 2026'
 });
 if(!batch.gray){
  const texture=labelTexture('南洋书院',{width:256,height:768,vertical:true,
   background:'rgba(0,0,0,0)',color:'#ecc889'});
  if(texture){
   const s=(left-.13)-Math.max(.25,left-1.62);
   const center=Math.max(.25,left-1.62)+s/2;
   const sign=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(s-.13,1.3),5.15),
    new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
   sign.name='Nanyang East 9 / vertical name inscription';
   sign.position.set(front.a[0]+front.ux*center+front.nx*.24,
    baseY+3.48,front.a[1]+front.uz*center+front.nz*.24);
   sign.rotation.y=Math.atan2(front.nx,front.nz);
   sign.userData.buildingIndex=buildingIndex;
   sign.userData.place=building;
   sign.userData.owner='nanyang-east9-asset.js';
   asset.add(sign);
   const release=asset.dispose;let disposed=false;
   asset.dispose=()=>{if(disposed)return;disposed=true;release();texture.dispose();};
  }
 }
 return asset;
}
