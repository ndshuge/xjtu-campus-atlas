import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {labelTexture} from '../../architecture-kit.js';
import {planCells,cellBoundary} from '../../library-asset-plan.js';

export const NANYANG_EAST8_ID=263808679;

// Historic East-8 photos identify a pale tiled exterior, broad horizontal
// window bays, small exterior air-conditioning boxes and a blue entrance hood.
// They do not locate the entrance's compass-facing wall or document 2026 work.
// This module uses ONLY the existing East-8 OSM polygon; never apply to East 7/9.
export function createNanyangEast8Asset({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 if(building?.osmId!==NANYANG_EAST8_ID)throw Error('Nanyang East 8 requires OSM way/263808679');
 const height=building.height;
 const a=ownedArchitecture('Nanyang College East 8 / photographed tile-and-canopy exterior',{
  baseY,uniforms,stage,
  stoneTileScale:3.25,stoneTileOptions:{jointWidth:.032,jointContrast:.15},
  extraMaterials:{canopy:new THREE.MeshStandardMaterial({color:'#24689b',roughness:.84,metalness:.04})}
 });
 if(!a.gray){
  a.materials.stone.color.set('#d8dad6');
  a.materials.glass.color.set('#657b82');
  a.materials.frame.color.set('#b8bdb9');
  a.materials.dark.color.set('#59646a');
  a.materials.roof.color.set('#aaa9a4');
 }
 const rows=6; // OSM estimated 21m, NOT measured storeys
 // Reserve the photo-facing long wall for its own ribbon-window cadence.
 // The other three elevations keep the existing conservative shell fallback.
 const {edges}=a.shell(building.points,{top:height,rows,index:buildingIndex,height,bayWidth:3.3,
  face:e=>e.nz<-.85&&e.length>40});
 const north=edges.find(e=>e.nz<-.85&&e.length>40);
 if(!north)throw Error('East 8 mapped long north edge missing');
 if(a.gray)a.plane('stone',north,0,north.length,0,height,buildingIndex,height);
 if(!a.gray){
  const floor=height/rows,bayCount=Math.floor(north.length/3.25),bay=north.length/bayCount;
  // Real openings: stone is segmented around wider horizontal panes rather
  // than placed behind a duplicated, coplanar generic facade.
  for(let row=0;row<rows;row++){
   const bottom=row*floor,lo=bottom+floor*.30,hi=bottom+floor*.73;
   a.plane('stone',north,0,north.length,bottom,lo,buildingIndex,height);
   a.plane('stone',north,0,north.length,hi,bottom+floor,buildingIndex,height);
   for(let k=0;k<bayCount;k++){
    const start=k*bay,end=(k+1)*bay;
    const left=start+bay*.13,right=end-bay*.13;
    a.plane('stone',north,start,left,lo,hi,buildingIndex,height);
    a.plane('stone',north,right,end,lo,hi,buildingIndex,height);
    if(row===0&&Math.abs((start+end)/2-north.length/2)<5.0){
     a.plane('stone',north,left,right,lo,hi,buildingIndex,height);
     continue;
    }
    a.plane('glass',north,left,right,lo,hi,buildingIndex,height,-.08);
    for(const s of [left,right]){
     a.plane('frame',north,s-.055,s+.055,lo,hi,buildingIndex,height,.055);
    }
    for(const t of [1/3,2/3]){
     const s=left+(right-left)*t;
     a.plane('frame',north,s-.022,s+.022,lo,hi,buildingIndex,height,.045);
    }
   }
  }
  // Photo-inspired AC units, clustered rather than multiplied at every bay.
  // Exact device counts and positions are unknown; intentionally schematic.
  for(let row=1;row<rows-1;row++)for(const t of [.19,.47,.77]){
   const x=north.a[0]+north.ux*north.length*t;
   const z=north.a[1]+north.uz*north.length*t+north.nz*.25;
   const y=row*floor+floor*.69;
   a.box('frame',x,y,z,.70,.58,.43,buildingIndex,height);
   a.plane('dark',north,north.length*t-.24,north.length*t+.24,y+.1,y+.43,buildingIndex,height,.51);
  }
  // Blue hood and entry glass are documented by East-8 photograph. Its
  // placement on the north face is an unsurveyed, replaceable assumption.
  const s=north.length*.5;
  const xx=north.a[0]+north.ux*s;
  const zz=north.a[1]+north.uz*s;
  a.box('canopy',xx,2.78,zz+north.nz*1.00,8.4,.78,2.20,buildingIndex,height);
  for(const end of [-3.05,3.05]){
   const x=xx+north.ux*end,z=zz+north.uz*end;
   a.box('frame',x,.12,z+north.nz*.28,.20,2.85,.30,buildingIndex,height);
  }
  a.plane('glass',north,s-3.0,s+3.0,.08,2.74,buildingIndex,height,.15);
  for(const t of [-1,0,1]){
   const at=s+t*2;
   a.plane('frame',north,at-.048,at+.048,.08,2.82,buildingIndex,height,.21);
  }
 }
 const asset=a.finish({
  owner:'nanyang-east8-asset.js',osmIds:[NANYANG_EAST8_ID],
  sourceDataUnchanged:true,renderRows:rows,estimated:true,
  evidenceUrl:'https://xjtu.party/photos',
  supportingUniversityPhoto:'https://news.xjtu.edu.cn/info/1008/97423.htm',
  photoTakenAt:null,photoPeriod:'historical; site gallery online by 2019, university report 2016-03-05',
  photoLicense:'reference only, no binary/image reused',
  currentStateVerified:false,entranceOrientationVerified:false,
  entryPlacement:'north long face (OSM-local approximation)',
  unknown:'Actual entrance side, exact AC locations, 2026 facade, roof, storey heights and blue canopy survival'
 });
 // The school sign uses an original canvas glyph texture; no third-party
 // photograph or bitmap is copied into the published architecture.
 if(!a.gray){
  const texture=labelTexture('南洋书院',{background:'rgba(0,0,0,0)',color:'#f4f7f9'});
  if(texture){
   const s=north.length*.5;
   const x=north.a[0]+north.ux*s,z=north.a[1]+north.uz*s;
   const sign=new THREE.Mesh(new THREE.PlaneGeometry(6.8,.62),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));
   sign.name='Nanyang East 8 / entrance canopy name';
   sign.position.set(x,baseY+3.17,z+north.nz*2.17);
   sign.rotation.y=Math.atan2(north.nx,north.nz);
   sign.userData.buildingIndex=buildingIndex;
   sign.userData.buildingAssetMesh=true;
   sign.userData.owner='nanyang-east8-asset.js';
   asset.add(sign);
   const release=asset.dispose;asset.dispose=()=>{release();texture.dispose()};
  }
 }
 return asset;
}
