import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {planCells,cellBoundary} from '../../library-asset-plan.js';

const specifications=Object.freeze({
  centerTwo:{
    id:263625089,feature:'center-two-ridge',photo:'https://commons.wikimedia.org/wiki/File:西交兴庆之俯瞰中一楼_02.jpg',
    scope:'2025 aerial confirms the east U-shaped roof and red ridge breaks, but not eave heights or actual tile count'
  },
  centerThree:{
    id:263625087,feature:'center-three-ridge',photo:'https://commons.wikimedia.org/wiki/File:西交兴庆之俯瞰中一楼_02.jpg',
    scope:'2025 aerial confirms the west U-shaped roof and red ridge breaks; exact hip geometry not surveyed'
  },
  math:{
    id:263625090,feature:'math-roof-cornice',photo:'https://commons.wikimedia.org/wiki/File:西交兴庆之数学楼_02.png',
    scope:'2025 Commons photograph shows red pitch roof, stone columns and strong eave line; no surveyed cap spacing'
  },
  yifu:{
    id:263632772,feature:'yifu-curved-rim',photo:'https://you.ctrip.com/sight/xian7/1475829.html',
    scope:'photo illustrates metallic curved fascia and projecting soffit; radial flange width estimated'
  },
  sports:{
    id:264108763,feature:'sports-louver-return',photo:'https://www.xjtu.edu.cn/xxfw/ydcg.htm',
    scope:'official sports center photo illustrates deep horizontal louvres; 3D return depth not surveyed'
  }
});

function roofCapBox(batch,cx,y,cz,w,d,index,h,kind='ridge'){
 batch.box(kind,cx,y,cz,w,.14,d,index,h);
}
function photoFrame(building,batch,detail,opts){
 const meta=specifications[detail];
 return batch.finish({
  owner:'src/assets/south/'+opts.owner,osmIds:[meta.id],
  modelScope:'ADDITIVE_TO_PREEXISTING_ASSET',
  sourcePhoto:meta.photo,sourceUse:'reference-only; no source photo textures redistributed',
  detailFeature:meta.feature,photoLimit:meta.scope,originalRoofPreserved:true,
  heightMeasured:false,locationMeasured:false,
  geometryStatus:'photo-guided local detail; geometry heights and orientation still estimated',
  integratorNote:'Add alongside existing base asset; never replace main building or duplicate OSM massing',
  sourceDataUnchanged:true,
  baselineModel:opts.baseline
 });
}

export function buildPhotoDetail(key,{building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={},owner){
 const c=specifications[key];if(!c)throw Error('Unknown photo detail: '+key);
 if(building?.osmId!==c.id)throw Error('Expected OSM '+c.id);
 if(!Number.isInteger(buildingIndex)||buildingIndex<0)throw Error('Invalid original OSM index');
 const i=buildingIndex,h=building.height,edges=cellBoundary(planCells(building.points));
 const b=ownedArchitecture('R21 independent '+key+' photo detail',{baseY,stage,uniforms,
  extraMaterials:{
   ridge:new THREE.MeshStandardMaterial({color:'#bb6759',roughness:.88,side:THREE.DoubleSide}),
   edge:new THREE.MeshStandardMaterial({color:'#d6b8a1',roughness:.83,side:THREE.DoubleSide}),
   silver:new THREE.MeshStandardMaterial({color:'#a6b3b6',metalness:.43,roughness:.45,side:THREE.DoubleSide}),
   louver:new THREE.MeshStandardMaterial({color:'#5e574d',metalness:.22,roughness:.63,side:THREE.DoubleSide})
  }});
 if(!b.gray){b.materials.ridge.color.set('#b46655');b.materials.edge.color.set('#c4aa9c');}
 if(key==='centerTwo'||key==='centerThree'){
  // Derived from each existing red roof's ridge line in
  // createCentralBuildingsAsset; narrow caps sit ABOVE, never replace it.
  // Both U-shaped buildings are mirror images, but have different world X
  // coordinates; mixing them causes missing or floating roof detail.
  const two=key==='centerTwo';
  const xSpine=two?52.18:-109.62;
  const x0=two?62.0:-166.0, x1=two?108.0:-121.8;
  const north=two?-495.66:-496.15,south=two?-434.58:-434.23;
  roofCapBox(b,xSpine,h+.05,-465.0,.27,66.0,i,h);
  for(const z of [north,south])roofCapBox(b,(x0+x1)/2,h+.045,z,Math.abs(x1-x0),.28,i,h);
  // Red tile eave edge visible along the external side of the two U wings.
  const zz=two?[-504.10,-427.12]:[-504.70,-425.52];
  for(const z of zz)roofCapBox(b,(x0+x1)/2,h-2.06,z,Math.abs(x1-x0)+3.0,.12,i,h,'edge');
 }
 if(key==='math'){
  const ps=building.points,x0=Math.min(...ps.map(p=>p[0])),x1=Math.max(...ps.map(p=>p[0]));
  const z0=Math.min(...ps.map(p=>p[1])),z1=Math.max(...ps.map(p=>p[1])),mid=(z0+z1)*.5;
  roofCapBox(b,(x0+x1)/2,h+.08,mid,x1-x0-.65,.26,i,h);
  for(const z of [z0+.10,z1-.10])roofCapBox(b,(x0+x1)/2,h-2.47,z,x1-x0-.7,.20,i,h,'edge');
  // Add photographically present square capital blocks to existing columns,
  // on the same OSM front used by the math-owned asset.
  const front=edges.filter(e=>e.length>50).sort((a,c)=>(c.a[1]+c.b[1])-(a.a[1]+a.b[1]))[0];
  const len=front.length,center=len*.5;
  for(const s of [center-5.0,center-1.7,center+1.7,center+5.0]){
   const px=front.a[0]+front.ux*s, pz=front.a[1]+front.uz*s+front.nz*.27;
   b.box('edge',px,7.02,pz,.85,.27,.68,i,h);
  }
 }
 if(key==='yifu'){
  const face=edges.filter(e=>e.length>=10).sort((a,c)=>(c.a[1]+c.b[1])-(a.a[1]+a.b[1]))[0];
  const L=face.length,mid=L*.5,radius=Math.min(L*.28,5.2)+.56;
  const at=(angle,r,y)=>[
   face.a[0]+face.ux*(mid+r*Math.sin(angle))+face.nx*r*Math.cos(angle),
   baseY+y,
   face.a[1]+face.uz*(mid+r*Math.sin(angle))+face.nz*r*Math.cos(angle)
  ];
  // A 15cm silver edge describes the circular metal soffit visible under
  // the existing photo-constrained fascia, without adding a new canopy.
  const n=36;
  for(let j=0;j<n;j++){
   const u=-Math.PI/2+j*Math.PI/n,v=u+Math.PI/n;
   b.quad('silver',[at(u,radius+.15,4.75),at(u,radius+.15,4.87),
    at(v,radius+.15,4.87),at(v,radius+.15,4.75)],i,h);
   b.quad('edge',[at(u,radius+.11,3.77),at(u,radius+.11,3.87),
    at(v,radius+.11,3.87),at(v,radius+.11,3.77)],i,h);
  }
 }
 if(key==='sports'){
  const face=edges.filter(e=>e.length>25&&e.length<32).sort((a,c)=>
   Math.abs((a.a[1]+a.b[1])*.5+11.26)-Math.abs((c.a[1]+c.b[1])*.5+11.26))[0];
  if(!face)throw Error('Sports photo courtyard face missing');
  const L=face.length,at=(s,out,y)=>[
   face.a[0]+face.ux*s+face.nx*out,
   baseY+y,
   face.a[1]+face.uz*s+face.nz*out
  ];
  // The former first draft had only front-facing horizontal slats; end
  // returns indicate photo-visible depth when viewed obliquely. Their
  // spacing follows the EXISTING 20 slats and never introduces a new floor.
  for(let row=0;row<20;row++){
   const y=6.35+row*5.55/19;
   for(const s of [L*.01,L*.99])
    b.quad('louver',[at(s,1.78,y-.075),at(s,2.5,y-.075),
      at(s,2.5,y+.075),at(s,1.78,y+.075)],i,h);
  }
  for(const s of [L*.01,L*.99]){
   b.quad('silver',[at(s-.08,2.48,6.21),at(s+.08,2.48,6.21),
    at(s+.08,2.48,12.3),at(s-.08,2.48,12.3)],i,h);
  }
 }
 return photoFrame(building,b,key,{owner,baseline:key.startsWith('center')?'src/central-buildings-asset.js':
   key==='math'?'src/assets/south/math-building-asset.js':key==='yifu'?'src/assets/south/yifu-engineering-asset.js':
   'src/assets/south/sports-education-center-asset.js'});
}
