import {ownedArchitecture} from '../../building-asset-kit.js';

export const ZHONGYING_EAST3_ID=263808685;

// 2013 photo by Weisi Dai / Multiple1902, Wikimedia Commons CC BY-SA 3.0:
// ground-floor glazed commercial/management frontage, gray stone base,
// pale tiled upper facade, and rounded upper corner balconies.
// Current businesses, exact facade compass direction and 2026 renovation
// remain unverified, so no historic retailer brands are reconstructed.
export function createZhongyingEast3Asset({
 building,buildingIndex,baseY=1.1,uniforms={},stage='material'
}={}){
 if(building?.osmId!==ZHONGYING_EAST3_ID)throw Error('Zhongying East3 requires OSM way/263808685');
 const height=building.height,lower=4.0;
 const a=ownedArchitecture('Zhongying East3 / historic ground-floor shopfront',{
  baseY,uniforms,stage,stoneTileScale:2.8,
  stoneTileOptions:{jointWidth:.03,jointContrast:.13}
 });
 if(!a.gray){
  a.materials.stone.color.set('#d1d5d5');
  a.materials.glass.color.set('#586e76');
  a.materials.frame.color.set('#bdc5c6');
  a.materials.dark.color.set('#4a5359');
  a.materials.roof.color.set('#aeb3b4');
 }
 const {edges}=a.shell(building.points,{top:height,rows:7,index:buildingIndex,height,
  bayWidth:3.25,face:e=>e.nx>.94&&e.length>31});
 const front=edges.find(e=>e.nx>.94&&e.length>31);
 if(!front)throw Error('Zhongying East3 long OSM frontage changed');
 const L=front.length;
 let balconySegments=0;
 if(a.gray){
  a.plane('stone',front,0,L,0,height,buildingIndex,height);
 }else{
  // The documentary photo only confirms the facade, not compass direction.
  // East long OSM facade is provisionally chosen for the ground shopfront.
  // The documented upper accommodation has wider two-casement openings
  // and generous pale tiled lintels; avoid a repeated generic square grid.
  const windowRows=6,upperBayCount=Math.max(5,Math.floor(L/3.20));
  const upperBay=L/upperBayCount,upperFloor=(height-lower)/windowRows;
  for(let row=0;row<windowRows;row++){
   const y=lower+upperFloor*row;
   const lo=y+upperFloor*.34,hi=y+upperFloor*.75;
   a.plane('stone',front,0,L,y,lo,buildingIndex,height);
   a.plane('stone',front,0,L,hi,y+upperFloor,buildingIndex,height);
   for(let k=0;k<upperBayCount;k++){
    const from=k*upperBay,to=(k+1)*upperBay;
    const l=from+upperBay*.12,r=to-upperBay*.12;
    a.plane('stone',front,from,l,lo,hi,buildingIndex,height);
    a.plane('stone',front,r,to,lo,hi,buildingIndex,height);
    a.plane('glass',front,l,r,lo,hi,buildingIndex,height,-.05);
    for(const x of [l,(l+r)*.5,r])
     a.plane('frame',front,x-.042,x+.042,lo,hi,buildingIndex,height,.04);
   }
  }
  a.plane('dark',front,0,L,0,.92,buildingIndex,height);
  const count=5,bay=L/count;
  for(let k=0;k<count;k++){
   const x0=k*bay+.20,x1=(k+1)*bay-.20;
   if(k%3===1){
    a.plane('frame',front,x0,x1,1.0,lower-.15,buildingIndex,height,.06);
    a.plane('dark',front,x0+.12,x1-.12,1.03,lower-.28,buildingIndex,height,.11);
    for(let j=1;j<13;j++){
     const xx=x0+(x1-x0)*j/13;
     a.plane('frame',front,xx-.018,xx+.018,1.08,lower-.20,buildingIndex,height,.17);
    }
   }else{
    a.curtain(front,{from:x0,to:x1,bottom:1.0,top:lower-.16,index:buildingIndex,height,columns:4,rows:2});
    a.plane('stone',front,x0,x1,lower-.18,lower,buildingIndex,height,.08);
   }
   if(k<count-1)a.plane('stone',front,(k+1)*bay-.20,(k+1)*bay+.20,0,lower,buildingIndex,height,.08);
  }
  // Only the photographed corner has rounded balcony projections.
  // Approximate small arcs preserve their characteristic silhouette
  // without inventing repeated balconies on unrelated elevations.
  const sectionCount=8,arcCenter=L*.145,radius=.98;
  const pos=(s,y,out)=>[
   front.a[0]+front.ux*s+front.nx*out,baseY+y,
   front.a[1]+front.uz*s+front.nz*out
  ];
  for(let floor=2;floor<=5;floor++){
   const y=floor*height/7+.14;
   for(let k=0;k<sectionCount;k++){
    const t0=Math.PI*k/sectionCount,t1=Math.PI*(k+1)/sectionCount;
    const s0=arcCenter+radius*Math.cos(t0),s1=arcCenter+radius*Math.cos(t1);
    const d0=.18+radius*Math.sin(t0),d1=.18+radius*Math.sin(t1);
    a.quad('frame',[
     pos(s0,y,.015),pos(s1,y,.015),pos(s1,y,d1),pos(s0,y,d0)
    ],buildingIndex,height);
    a.quad('stone',[
     pos(s0,y+.10,d0),pos(s1,y+.10,d1),
     pos(s1,y+.61,d1),pos(s0,y+.61,d0)
    ],buildingIndex,height);
    balconySegments++;
   }
  }
 }
 return a.finish({
  owner:'zhongying-east3-asset.js',osmIds:[ZHONGYING_EAST3_ID],
  photoTakenAt:'2013-06-01T17:34:23',
  photoUrl:'https://commons.wikimedia.org/wiki/File:XJTU_East-3_Dorm_Building.jpg',
  photoCredit:'Weisi Dai (Multiple1902), CC BY-SA 3.0; no photo reused as texture',
  sourceDataUnchanged:true,currentStateVerified:false,
  groundFloorRetailCurrentVerified:false,balconySegments,
  facadeOrientationVerified:false,
  entryFacade:'east long edge approximate; 2013 viewpoint not georeferenced',
  unknown:'2026 actual ground floor shops and management use, balcony enclosure, roof, floor count and entrance'
 });
}
