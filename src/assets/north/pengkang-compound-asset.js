import {ownedArchitecture} from '../../building-asset-kit.js';

export const PENGKANG_COMPOUND_ID=263807970;
const COURT=[248,425],ROWS=6;

// This is the single U-shaped OSM way for East 18/19/20, not a single dorm.
// Courtyard balconies are visible in the school's 2020-12-04 photograph.
// Storey height, current enclosure and the identity of each wing are unknown.
export function createPengkangCompoundAsset({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 if(building?.osmId!==PENGKANG_COMPOUND_ID)throw Error('Expected Pengkang East 18/19/20 OSM compound');
 const height=building.height;
 const batch=ownedArchitecture('Pengkang East 18/19/20 / U-courtyard historical-reference',{baseY,uniforms,stage});
 if(!batch.gray){
  batch.materials.stone.color.set('#d8d8d2');
  batch.materials.glass.color.set('#485963');
  batch.materials.frame.color.set('#b4bbb7');
  batch.materials.dark.color.set('#4d5860');
  batch.materials.roof.color.set('#999d98');
 }
 const {edges}=batch.shell(building.points,{top:height,rows:ROWS,index:buildingIndex,height,bayWidth:3.6});
 const inner=edges.filter(e=>{
  const mx=(e.a[0]+e.b[0])/2,mz=(e.a[1]+e.b[1])/2;
  const dx=COURT[0]-mx,dz=COURT[1]-mz;
  return e.length>10&&Math.hypot(dx,dz)<32&&e.nx*dx+e.nz*dz>5;
 });
 if(!batch.gray)for(const e of inner){
  const at=(s,y,o)=>[e.a[0]+e.ux*s+e.nx*o,baseY+y,e.a[1]+e.uz*s+e.nz*o];
  const floor=height/ROWS,count=Math.max(2,Math.floor(e.length/3.6)),bay=e.length/count;
  for(let row=0;row<ROWS;row++){
   const bottom=row*floor+floor*.31,top=Math.min(height-.4,(row+1)*floor-floor*.19);
   for(let j=0;j<count;j++){
    const s=(j+.5)*bay;
    batch.plane('dark',e,s-bay*.36,s+bay*.36,bottom,top,buildingIndex,height,.115);
   }
   const y=row*floor+floor*.29;
   batch.quad('frame',[at(0,y,.09),at(e.length,y,.09),
    at(e.length,y,.42),at(0,y,.42)],buildingIndex,height);
   batch.plane('frame',e,0,e.length,y-.02,y+.15,buildingIndex,height,.42);
   batch.plane('frame',e,0,e.length,y+.48,y+.57,buildingIndex,height,.37);
  }
 }
 return batch.finish({
  owner:'pengkang-compound-asset.js',osmIds:[PENGKANG_COMPOUND_ID],
  footprint:'OSM U shape retained / courtyard void preserved',
  courtyardEdges:inner.length,balconyRows:ROWS,
  evidenceUrl:'https://news.xjtu.edu.cn/info/1011/125700.htm',
  evidenceDate:'2020-12-04',photoCaptureDate:null,currentStateVerified:false,
  geometryBasis:'2020 courtyard balcony photograph and source OSM footprint',
  unknown:'Wing-to-number mapping, current balcony enclosure, roof, entrances and measured floor heights'
 });
}
