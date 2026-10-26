import * as THREE from 'three';
import {LIBRARY_TIERS} from './library-facade.js';
import {flat} from './geo.js';
import {libraryMassingPlan} from './library-massing.js';

// Photo/document-based groundcover, not an invented ornamental roof garden.
// XJTU Planning & Construction Centre, 2017-04-07:
// https://news.xjtu.edu.cn/info/1219/153746.htm
// The university explicitly identifies Qian Xuesen Library as a completed
// Class-C rooftop planting: turf / ground-cover and climbing plants, NOT
// Class-B shrub planters, benches, or paths. 2026 continuity is unverified.
// Geometries below estimate the accessible annular terrace bands from the
// existing interpretation model; there is no survey of planted coverage.
function turfTexture(){
 const size=64,rgba=new Uint8Array(size*size*4);
 let state=20170407;
 for(let i=0;i<size*size;i++){
  state=(Math.imul(1664525,state)+1013904223)>>>0;
  const n=(state>>>24)/255;
  const variation=Math.round((n-.5)*37);
  rgba[i*4]=Math.max(0,90+variation);
  rgba[i*4+1]=Math.max(0,116+variation);
  rgba[i*4+2]=Math.max(0,66+Math.round(variation*.7));
  rgba[i*4+3]=255;
 }
 const tex=new THREE.DataTexture(rgba,size,size,THREE.RGBAFormat);
 tex.colorSpace=THREE.SRGBColorSpace;
 tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
 tex.repeat.set(3,2);
 tex.magFilter=THREE.LinearFilter;
 tex.minFilter=THREE.LinearMipmapLinearFilter;
 tex.generateMipmaps=true;
 tex.needsUpdate=true;
 return tex;
}

export function createLibraryGreenRoofs({centerX,steppedCenterZ,baseY=1.1,footprint=[]}){
 const group=new THREE.Group();
 group.name='Qian Xuesen Library / documented Class-C groundcover terraces';
 const material=new THREE.MeshStandardMaterial({
  color:'#b4c7a6',map:turfTexture(),roughness:1,metalness:0,
  polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1
 });
 const make=(name,w,d,x,z,y)=>{
  if(w<.45||d<.45)return;
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,.075,d),material);
  mesh.name=name;
  mesh.position.set(centerX+x,baseY+13+y-.035,steppedCenterZ+z);
  mesh.castShadow=false;
  mesh.receiveShadow=true;
  group.add(mesh);
 };
 // Terrace surfaces are the exposed parts of each lower roof around the
 // footprint of the next tier. Keep setbacks clear and no floating vegetation.
 for(let i=0;i<LIBRARY_TIERS.length-1;i++){
  const a=LIBRARY_TIERS[i],b=LIBRARY_TIERS[i+1];
  const outerW=a.w-1.2,outerD=a.d-1.2;
  const innerW=b.w+1.3,innerD=b.d+1.3;
  const side=(outerW-innerW)/2,depth=(outerD-innerD)/2;
  if(side<=0||depth<=0)continue;
  const x=innerW/2+side/2,z=innerD/2+depth/2;
  make('terrace '+(i+1)+' west groundcover',side,outerD,-x,0,a.h);
  make('terrace '+(i+1)+' east groundcover',side,outerD,x,0,a.h);
  make('terrace '+(i+1)+' south groundcover',innerW,depth,0,z,a.h);
  make('terrace '+(i+1)+' north groundcover',innerW,depth,0,-z,a.h);
 }
 // The 2025 overhead photograph also shows green cover on both broad south
 // side-wing roofs. Reuse the existing turf material and OSM roof polygons;
 // no new garden furniture, ground elevation, or presumed corridor clearance.
 const plan=libraryMassingPlan(footprint);
 for(const wing of plan?.southRoofWings||[]){
  const mesh=new THREE.Mesh(flat(wing.points,baseY+13+.045),material);
  mesh.name='2025 photo-matched '+wing.id+' roof groundcover';mesh.receiveShadow=true;mesh.castShadow=false;group.add(mesh);
 }
 group.userData={
  source:'https://news.xjtu.edu.cn/info/1219/153746.htm',
  published:'2017-04-07',
  documentedType:'Class C low groundcover; no B-class garden amenities',
  geometry:'Estimated terraces; no measured planted extents',
  asOf2026:'Unverified; historic reconstruction, not current survey',
  imageRights:'No source photo is stored or mapped as texture',
  aerialCoverage:'Liuxingy / 2025-07-25 / CC BY-SA 4.0, side-wing extents approximate'
 };
 return group;
}
