import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {planCells,cellBoundary,clipCell} from '../../library-asset-plan.js';
import {bounds} from '../../geo.js';

// OSM 264288694 is the HISTORIC memorial, not the 2019 modern
// relocation museum (OSM 1167525875). The clinic's NORTH/SOUTH wing
// identity is unknown. School sources confirm two-storey buildings,
// gray masonry and red tile roofs; precise roof ridges are unmeasured.
export const HISTORIC_MEMORIAL_ID=264288694;
export const HISTORIC_MEMORIAL_SOURCE='https://news.xjtu.edu.cn/info/1219/156353.htm';
export const HISTORIC_MEMORIAL_PHOTO='https://cssy.xjtu.edu.cn/info/1121/2460.htm';

const STOREYS=2;
const EAVE=6.6; // 2-storey interpretation; NOT a field measurement
const ROOF_RISE=1.55; // illustrative pitched roof; ridges unknown
const ROOF_GRID_METRES=2.4;

function makeGeneratedRoofTileTexture(){
 // Original procedural pixels, NOT a downloaded or traced historic photo.
 // Two 64px rows of clay tiles with a half-cell offset and shaded edges.
 const n=128,data=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const row=Math.floor(y/64),sx=(x+(row?32:0))%128;
  const col=Math.floor(sx/64),lx=sx%64,ly=y%64;
  const variation=((col*31+row*47)%13)-6;
  const rim=ly<4||lx<2||lx>61;
  const ridge=Math.sin(lx/64*Math.PI)*7;
  const dark=rim?-25:0;
  const at=(y*n+x)*4;
  data[at]=Math.max(0,153+variation+ridge+dark);
  data[at+1]=Math.max(0,73+variation*.6+dark*.65);
  data[at+2]=Math.max(0,57+variation*.7+dark*.55);
  data[at+3]=255;
 }
 const tx=new THREE.DataTexture(data,n,n,THREE.RGBAFormat);
 tx.wrapS=THREE.RepeatWrapping;tx.wrapT=THREE.RepeatWrapping;
 tx.colorSpace=THREE.SRGBColorSpace;
 tx.magFilter=THREE.LinearFilter;tx.minFilter=THREE.LinearMipmapLinearFilter;
 tx.generateMipmaps=true;tx.anisotropy=4;tx.needsUpdate=true;
 return tx;
}

function pointDistanceToEdge(p,e){
 const dx=p[0]-e.a[0],dz=p[1]-e.a[1];
 const along=Math.max(0,Math.min(e.length,dx*e.ux+dz*e.uz));
 return Math.hypot(dx-e.ux*along,dz-e.uz*along);
}

// Perimeter-distance roof heightfield conservatively keeps every roof
// triangle within a clipped OSM cell. No guessed ridge/wing duplication.
function roofTriangles(cells,edges,baseY){
 const bb=bounds(cells.flat()),positions=[];
 const roofY=p=>baseY+EAVE+Math.min(ROOF_RISE,
  Math.min(...edges.map(e=>pointDistanceToEdge(p,e)))*.33);
 for(let x=bb[0];x<bb[2];x+=ROOF_GRID_METRES)
  for(let z=bb[1];z<bb[3];z+=ROOF_GRID_METRES){
   const rect=[x,z,Math.min(x+ROOF_GRID_METRES,bb[2]),
    Math.min(z+ROOF_GRID_METRES,bb[3])];
   for(const cell of cells){
    const clipped=clipCell(cell,rect);
    if(clipped.length<3)continue;
    for(let j=1;j<clipped.length-1;j++)
     for(const p of [clipped[0],clipped[j+1],clipped[j]])
      positions.push(p[0],roofY(p),p[1]);
   }
  }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 const uv=[];
 for(let i=0;i<positions.length;i+=3)uv.push(positions[i]/.8,positions[i+2]/.52);
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.computeVertexNormals();
 return geo;
}

export function createHistoricMemorialAsset({
 building,buildingIndex,baseY=1.1,uniforms={},stage='material'
}={}){
 if(building?.osmId!==HISTORIC_MEMORIAL_ID)
  throw Error('Expected historic memorial OSM 264288694 (not new museum)');
 if(!Number.isInteger(buildingIndex)||buildingIndex<0)
  throw Error('Invalid historic memorial index');
 const originalHeight=building.height;
 const cells=planCells(building.points),edges=cellBoundary(cells);
 if(!cells.length||!edges.length)throw Error('Historic OSM has empty footprint');
 const batch=ownedArchitecture('Historic Westward Relocation Memorial / one footprint',{
  baseY,uniforms,stage,stoneTileScale:1.65,
  stoneTileOptions:{jointWidth:.017,jointContrast:.10}
 });
 if(!batch.gray){
  batch.materials.stone.color.set('#999993');
  batch.materials.roof.color.set('#a65c45');
  batch.materials.dark.color.set('#72483b');
  batch.materials.glass.color.set('#506068');
 }
 const roofTexture=stage==='massing'?null:makeGeneratedRoofTileTexture();
 if(roofTexture){batch.materials.roof.map=roofTexture;
  batch.materials.roof.color.set('#ffffff');
  batch.materials.roof.needsUpdate=true;
 }
 for(const e of edges){
  // Two-storey volume and brick alone are verified; window position/count
  // and the circular SOUTH-wing entrance must not be fabricated here.
  batch.plane('stone',e,0,e.length,0,EAVE,buildingIndex,originalHeight);
  batch.plane('dark',e,0,e.length,EAVE-.16,EAVE,buildingIndex,originalHeight,.012);
  // Small red eave band follows OSM. 0.28 m projection is illustrative.
  const at=(along,normal,y)=>[
   e.a[0]+e.ux*along+e.nx*normal,
   baseY+y,
   e.a[1]+e.uz*along+e.nz*normal
  ];
  batch.quad('roof',[
   at(0,-.02,EAVE+.06),at(0,.30,EAVE+.06),
   at(e.length,.30,EAVE+.06),at(e.length,-.02,EAVE+.06)
  ],buildingIndex,originalHeight);
 }
 batch.add('roof',roofTriangles(cells,edges,baseY),buildingIndex,originalHeight);
 const asset=batch.finish({
  owner:'src/assets/south/historic-memorial-asset.js',
  osmIds:[HISTORIC_MEMORIAL_ID],
  newMuseumIdExcluded:1167525875,
  officialSource:HISTORIC_MEMORIAL_SOURCE,
  referencePhoto:HISTORIC_MEMORIAL_PHOTO,
  sourceLicense:'reference-only; no copied textures',
  wingIdentity:'unresolved-north-vs-south',
  twoBuildingsInHistory:true,secondBuildingModelled:false,
  storeysConfirmedBySchool:STOREYS,
  osmHeightMeters:originalHeight,
  osmHeightSource:building.heightSource,
  visualEaveEstimateMeters:EAVE,
  visualRoofPeakEstimateMeters:EAVE+ROOF_RISE,
  roofGeometry:'approximate sloped perimeter-heightfield',
  roofSurveyStatus:'not-verified',
  entrancePlacement:'unverified-not-modelled',
  hospitalCrossPlacement:'unverified-not-modelled',
  confirmedFeatures:['two-storey-clinic','grey-masonry','red-tile-roof'],
  inferredFeatures:['2-storey visual height','roof ridge locations','eave projection'],
  sourceDataUnchanged:true,
  geomFootprintStatus:'unchanged-OSM',
  integrationStatus:'separate adapter required; generic mass must be excluded'
 });
 if(roofTexture){
  const originalDispose=asset.dispose;
  asset.dispose=()=>{originalDispose();roofTexture.dispose();};
 }
 return asset;
}
