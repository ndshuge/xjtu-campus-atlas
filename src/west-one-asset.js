import {ownedArchitecture} from './building-asset-kit.js';
import {planCells,cellBoundary} from './library-asset-plan.js';

// The available West 1 teaching/office building photograph (xjtu.party/photos)
// shows white tile, deeply repeated windows, and wall-mounted AC units.
// The photographed face's compass orientation and the units' exact positions
// are not surveyed. Limit the details to one long, inward-facing wing.
function addPhotoFacadeAC(a,building,index){
 const edges=cellBoundary(planCells(building.points));
 const e=edges.find(e=>e.length>48&&e.ux>.95
  &&Math.abs((e.a[1]+e.b[1])/2+517)<.75&&e.a[0]<-330);
 if(!e)return null;
 const units=[],bayCount=Math.floor(e.length/3.25),bay=e.length/bayCount;
 const at=(s,y,offset)=>[
  e.a[0]+e.ux*s+e.nx*offset,
  a.baseY+y,
  e.a[1]+e.uz*s+e.nz*offset
 ];
 for(let row=1;row<6;row++)for(let i=0;i<bayCount;i++){
  const s=(i+.89)*bay,localY=(row+.51)*WEST_ONE_APPROX_HEIGHT/6;
  const [x,y,z]=at(s,localY,+.29);
  // Box body is physically outboard of the existing window's wall plane.
  // The edge normal points OUT of this mapped wing. Front at +0.53.
  a.box('stone',x,localY-.33,z,.62,.66,.46,index,WEST_ONE_APPROX_HEIGHT);
  const front=(u,v,o)=>at(u,v,o),w=.40,h=.32;
  a.quad('glass',[
   front(s-w/2,localY-h/2,+.531),
   front(s-w/2,localY+h/2,+.531),
   front(s+w/2,localY+h/2,+.531),
   front(s+w/2,localY-h/2,+.531)
  ],index,WEST_ONE_APPROX_HEIGHT);
  for(const offset of [-.065,.055])a.quad('stone',[
   front(s-w*.43,localY+offset,+.54),
   front(s-w*.43,localY+offset+.022,+.54),
   front(s+w*.43,localY+offset+.022,+.54),
   front(s+w*.43,localY+offset,+.54)
  ],index,WEST_ONE_APPROX_HEIGHT);
  units.push([+x.toFixed(3),+y.toFixed(3),+z.toFixed(3)]);
 }
 return {source:'XJTU West 1 Teaching/Office Building, xjtu.party/photos',
  sourceUrl:'https://xjtu.party/photos',license:'reference-only; attribution unknown',
  estimated:true,selectedFace:'long wing at north OSM boundary',bayFraction:.89,caseWidth:.62,count:units.length,units};
}

export const WEST_ONE_ID = 263625085;
export const WEST_ONE_APPROX_HEIGHT = 21;

// Photo-guided exterior; the source OSM polygon and selectable building ID stay
// intact. The photograph shows a pale tiled facade and approximately six
// visible levels; height, individual wings and unphotographed faces are estimates.
export function createWestOneAsset({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 if(building?.osmId!==WEST_ONE_ID)throw new Error('West 1 requires its mapped building');
 const a=ownedArchitecture('West 1 / photo-guided exterior',{baseY,uniforms,stage});
 if(!a.gray){a.materials.stone.color.set('#d9d8d0');a.materials.glass.color.set('#71878b');a.materials.roof.color.set('#c2c3bd');a.materials.dark.color.set('#a9b1ad');}
 a.shell(building.points,{top:WEST_ONE_APPROX_HEIGHT,rows:6,index:buildingIndex,height:WEST_ONE_APPROX_HEIGHT,bayWidth:3.25});
 const photoFacadeAC=a.gray?null:addPhotoFacadeAC(a,building,buildingIndex);
 return a.finish({owner:'west-one-asset.js',osmIds:[WEST_ONE_ID],photoFacadeAC,sourceDataUnchanged:true,
  evidence:'https://commons.wikimedia.org/wiki/File:XJTU_West_1_Office_Building.jpg',
  unknown:'2013 photograph; estimated height, roof, side/rear facades and current appearance'});
}
