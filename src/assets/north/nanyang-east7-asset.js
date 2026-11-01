import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {labelTexture} from '../../architecture-kit.js';

export const NANYANG_EAST7_ID=263808678;

// Official Nanyang College gallery explicitly labels its close-up as East 7.
// Light tiled facade, long silver-framed windows, dense exterior AC boxes,
// broad blue university+college canopy, two glazed door banks and a small
// gold tablet at camera-right. Photo capture time and orientation unknown.
export function createNanyangEast7Asset({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 if(building?.osmId!==NANYANG_EAST7_ID)throw Error('Nanyang East 7 requires OSM way/263808678');
 const height=building.height;
 const batch=ownedArchitecture('Nanyang East 7 / wide college canopy',{
  baseY,uniforms,stage,stoneTileScale:3.6,
  stoneTileOptions:{jointWidth:.030,jointContrast:.12},
  extraMaterials:{
   canopy:new THREE.MeshStandardMaterial({color:'#1769ad',metalness:.08,roughness:.70}),
   plaque:new THREE.MeshStandardMaterial({color:'#c7a05b',metalness:.1,roughness:.72})
  }
 });
 if(!batch.gray){
  batch.materials.stone.color.set('#d8dad8');
  batch.materials.glass.color.set('#6b8589');
  batch.materials.frame.color.set('#bdc6c5');
  batch.materials.dark.color.set('#475358');
  batch.materials.roof.color.set('#adb2ad');
 }
 const rows=6;
 const {edges}=batch.shell(building.points,{top:height,rows,index:buildingIndex,height,
  bayWidth:3.4,face:e=>e.nz<-.85&&e.length>45});
 const front=edges.find(e=>e.nz<-.85&&e.length>45);
 if(!front)throw Error('East 7 needs north-facing long OSM frontage');
 const L=front.length,mid=L*.54,doorSpan=9.4,floor=height/rows;
 if(batch.gray)batch.plane('stone',front,0,L,0,height,buildingIndex,height);
 else{
  const bays=Math.floor(L/3.75),bay=L/bays;
  for(let row=0;row<rows;row++){
   const bottom=row*floor,lo=bottom+floor*.27,hi=bottom+floor*.76;
   for(let i=0;i<bays;i++){
    const from=i*bay,to=(i+1)*bay,a=from+bay*.09,b=to-bay*.09;
    const doorway=row===0&&from<mid+doorSpan/2&&to>mid-doorSpan/2;
    if(doorway){
     if(from<mid-doorSpan/2)batch.plane('stone',front,from,Math.min(to,mid-doorSpan/2),bottom,bottom+floor,buildingIndex,height);
     if(to>mid+doorSpan/2)batch.plane('stone',front,Math.max(from,mid+doorSpan/2),to,bottom,bottom+floor,buildingIndex,height);
     continue;
    }
    batch.plane('stone',front,from,to,bottom,lo,buildingIndex,height);
    batch.plane('stone',front,from,to,hi,bottom+floor,buildingIndex,height);
    batch.plane('stone',front,from,a,lo,hi,buildingIndex,height);
    batch.plane('stone',front,b,to,lo,hi,buildingIndex,height);
    batch.plane('glass',front,a,b,lo,hi,buildingIndex,height,-.09);
    for(const s of [a,a+(b-a)*.48,b])batch.plane('frame',front,s-.034,s+.034,lo,hi,buildingIndex,height,.04);
    if(row>0&&i%4===1)batch.plane('dark',front,b+.11,Math.min(to-.05,b+.50),
     bottom+floor*.83,bottom+floor*.95,buildingIndex,height,.025);
   }
  }
  // Two separate 3.5m glazed entry banks with a shared pale centre pier.
  const d0=mid-4.40,d1=mid-.48,d2=mid+.48,d3=mid+4.40;
  batch.curtain(front,{from:d0,to:d1,bottom:.10,top:2.73,index:buildingIndex,height,columns:4,rows:2});
  batch.curtain(front,{from:d2,to:d3,bottom:.10,top:2.73,index:buildingIndex,height,columns:4,rows:2});
  batch.plane('stone',front,d1,d2,0,3.25,buildingIndex,height,.04);
  batch.plane('stone',front,mid-5.3,mid+5.3,2.82,3.42,buildingIndex,height,.06);
  // Wide blue canopy is a standalone batch, different from East8's
  // narrow sign and East9's high glazed lobby.
  const x=front.a[0]+front.ux*mid,z=front.a[1]+front.uz*mid;
  batch.box('canopy',x,3.09,z+front.nz*1.06,12.8,.75,2.18,buildingIndex,height);
  for(const at of [d0,d1,d2,d3])batch.plane('frame',front,at-.045,at+.045,.10,2.72,buildingIndex,height,.14);
  // Right-side gold name tablet, as pictured, is separate from blue canopy.
  batch.plane('plaque',front,mid-8.75,mid-7.1,1.09,2.40,buildingIndex,height,.15);
  // AC banks are simplified, their exact count is not a measured survey.
  const cols=[.09,.26,.40,.64,.81,.92];
  for(let row=1;row<rows;row++)for(const t of cols.filter((_,i)=>i%2===row%2)){
   const s=L*t,yy=row*floor+floor*.78;
   const xx=front.a[0]+front.ux*s,zz=front.a[1]+front.uz*s+front.nz*.34;
   batch.box('frame',xx,yy,zz,.78,.55,.56,buildingIndex,height);
   batch.plane('dark',front,s-.25,s+.25,yy+.08,yy+.48,buildingIndex,height,.62);
  }
 }
 const asset=batch.finish({
  owner:'nanyang-east7-asset.js',osmIds:[NANYANG_EAST7_ID],sourceDataUnchanged:true,
  evidenceUrl:'https://nanyang.xjtu.edu.cn/sygk/syhj.htm',
  evidenceLabel:'南洋书院-东七舍',photoCaptureDate:null,photoLicense:'reference only',
  entryDoors:2,currentStateVerified:false,entranceOrientationVerified:false,
  selectedFace:'long Z-negative edge, interpretation not survey',
  unknown:'2024 fire-safety works impact, 2026 facade and lobby, orientation, rooftop, measured height'
 });
 if(!batch.gray){
  const textures=[];
  const addLabel=(text,color,background,w,h,s,y,offset,name)=>{
   const texture=labelTexture(text,{width:1024,height:128,color,background});
   if(!texture)return;
   textures.push(texture);
   const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),
    new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
   m.name=name;m.userData.buildingIndex=buildingIndex;m.userData.owner='nanyang-east7-asset.js';
   m.position.set(front.a[0]+front.ux*s+front.nx*offset,baseY+y,
    front.a[1]+front.uz*s+front.nz*offset);
   m.rotation.y=Math.atan2(front.nx,front.nz);
   asset.add(m);
  };
  addLabel('西安交通大学 · 南洋书院','#f5f4ea','rgba(0,0,0,0)',11.9,.55,mid,3.58,2.18,'East7 canopy inscription');
  addLabel('南洋书院','#342719','rgba(0,0,0,0)',1.45,.76,mid-7.92,1.75,.23,'East7 wall tablet inscription');
  const dispose=asset.dispose;let disposed=false;
  asset.dispose=()=>{if(disposed)return;disposed=true;dispose();for(const t of textures)t.dispose()};
 }
 return asset;
}
