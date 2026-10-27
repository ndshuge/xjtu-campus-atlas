import * as THREE from 'three';
import {architectureBatch,stoneMaterial,glassMaterial} from './architecture-kit.js';
import {planCells,cellBoundary} from './library-asset-plan.js';

// Small extension of the existing architecture batch: accumulate raw attributes
// before creating buffers. Each visible triangle keeps its original building ID.
export function ownedArchitecture(name,{baseY=1.1,stage='material',uniforms={}}={}){
 const gray=stage==='massing',mode={value:0};
 const materials={stone:stoneMaterial('#c8c0b3',.72),glass:glassMaterial('#344e60'),
  frame:new THREE.MeshStandardMaterial({color:'#828986',roughness:.55,metalness:.3}),
  roof:new THREE.MeshStandardMaterial({color:'#96988e',roughness:.95}),
  dark:new THREE.MeshStandardMaterial({color:'#404d51',roughness:.78})};
 if(gray)for(const m of Object.values(materials)){m.color.set('#bdbdb5');m.metalness=0;m.roughness=1;m.onBeforeCompile=()=>{};m.customProgramCacheKey=()=> 'r12-gray';}
 const arrays=Object.fromEntries(Object.keys(materials).map(k=>[k,{p:[],n:[],uv:[],id:[],h:[]}])) ;
 const add=(kind,geometry,index,height)=>{
  const g=geometry.index?geometry.toNonIndexed():geometry,a=arrays[kind];
  if(!g.attributes.normal)g.computeVertexNormals();
  for(let i=0;i<g.attributes.position.count;i++){
   a.p.push(g.attributes.position.getX(i),g.attributes.position.getY(i),g.attributes.position.getZ(i));
   a.n.push(g.attributes.normal.getX(i),g.attributes.normal.getY(i),g.attributes.normal.getZ(i));
   a.uv.push(g.attributes.uv?.getX(i)||0,g.attributes.uv?.getY(i)||0);a.id.push(index);a.h.push(height);
  }
  g.dispose();if(g!==geometry)geometry.dispose();
 };
 const quad=(kind,ps,index,height)=>{
  const a=arrays[kind],v=ps[1].map((x,i)=>x-ps[0][i]),w=ps[2].map((x,i)=>x-ps[0][i]);
  const cross=[v[1]*w[2]-v[2]*w[1],v[2]*w[0]-v[0]*w[2],v[0]*w[1]-v[1]*w[0]],length=Math.hypot(...cross)||1;
  for(const k of [0,1,2,0,2,3]){a.p.push(...ps[k]);a.n.push(...cross.map(x=>x/length));a.uv.push(k<2?0:1,k===0||k===3?0:1);a.id.push(index);a.h.push(height);}
 };
 const box=(kind,x,bottom,z,w,h,d,index,height)=>{
  if(w<=0||h<=0||d<=0)return;
  const g=new THREE.BoxGeometry(w,h,d);g.translate(x,baseY+bottom+h/2,z);add(kind,g,index,height);
 };
 const plane=(kind,e,from,to,bottom,top,index,height,offset=0)=>{
  if(to-from<.005||top-bottom<.005)return;
  const at=(s,y)=>[e.a[0]+e.ux*s+e.nx*offset,baseY+y,e.a[1]+e.uz*s+e.nz*offset];
  quad(kind,[at(from,bottom),at(from,top),at(to,top),at(to,bottom)],index,height);
 };
 const roof=(cells,y,index,height,kind='roof')=>{
  for(const ps of cells)for(let i=1;i<ps.length-1;i++){
   const p=[ps[0],ps[i+1],ps[i]],a=arrays[kind];
   for(const v of p){a.p.push(v[0],baseY+y,v[1]);a.n.push(0,1,0);a.uv.push(v[0]/6,v[1]/6);a.id.push(index);a.h.push(height);}
  }
 };
 const wall=(e,{bottom=0,top,rows,index,height=top,kind='stone',from=0,to=e.length,bayWidth=3.5}={})=>{
  if(gray||to-from<2.5){plane(kind,e,from,to,bottom,top,index,height);return;}
  const count=Math.max(1,Math.floor((to-from)/bayWidth)),bay=(to-from)/count,floor=(top-bottom)/rows;
  for(let row=0;row<rows;row++){
   const y=bottom+row*floor,lo=y+floor*.23,hi=y+floor*.80;
   plane(kind,e,from,to,y,lo,index,height);plane(kind,e,from,to,hi,y+floor,index,height);
   for(let k=0;k<count;k++){
    const x=from+k*bay,left=x+bay*.21,right=x+bay*.79;
    plane(kind,e,k?x-bay*.21:from,left,lo,hi,index,height);
    if(k===count-1)plane(kind,e,right,to,lo,hi,index,height);
    plane('glass',e,left,right,lo,hi,index,height,-.10);
    // Short jambs provide depth without thousands of overlapping box windows.
    const at=(s,y,o)=>[e.a[0]+e.ux*s+e.nx*o,baseY+y,e.a[1]+e.uz*s+e.nz*o];
    quad('dark',[at(left,lo,0),at(left,hi,0),at(left,hi,-.11),at(left,lo,-.11)],index,height);
    quad('dark',[at(right,lo,-.11),at(right,hi,-.11),at(right,hi,0),at(right,lo,0)],index,height);
   }
  }
 };
 const curtain=(e,{from=0,to=e.length,bottom=0,top,index,height=top,columns=6,rows=4}={})=>{
  if(gray){plane('stone',e,from,to,bottom,top,index,height);return;}
  plane('glass',e,from,to,bottom,top,index,height,-.10);
  for(let i=0;i<=columns;i++){const s=from+i*(to-from)/columns;plane('frame',e,Math.max(from,s-.065),Math.min(to,s+.065),bottom,top,index,height,.025);}
  for(let j=1;j<rows;j++){const y=bottom+j*(top-bottom)/rows;plane('frame',e,from,to,y-.075,y+.075,index,height,.03);}
 };
 const shell=(points,{top,rows,index,height=top,kind='stone',face}={})=>{
  const cells=planCells(points),edges=cellBoundary(cells);
  for(const e of edges)if(!face?.(e))wall(e,{top,rows,index,height,kind});roof(cells,top,index,height);return {cells,edges};
 };
 const finish=metadata=>{
  const batch=architectureBatch(name,materials);
  for(const [kind,a] of Object.entries(arrays))if(a.p.length){
   const g=new THREE.BufferGeometry();
   for(const [key,values,size] of [['position',a.p,3],['normal',a.n,3],['uv',a.uv,2],['buildingIndex',a.id,1],['assetHeight',a.h,1]])g.setAttribute(key,new THREE.Float32BufferAttribute(values,size));
   batch.add(kind,g);
  }
  const asset=batch.finish();asset.userData={...metadata,stage,estimated:true,units:'metres',axes:'x east / y up / z south',identityTransform:true};
  asset.setColorMode=value=>{mode.value=value==='natural'?0:value==='category'?1:2;};
  asset.traverse(mesh=>{if(!mesh.isMesh)return;mesh.userData.buildingAssetMesh=true;mesh.userData.owner=metadata.owner;
   const m=mesh.material,previous=m.onBeforeCompile,key=m.customProgramCacheKey.bind(m);
   m.onBeforeCompile=s=>{previous(s);s.uniforms.uAssetSelected=uniforms.selection||{value:-1};s.uniforms.uAssetHover=uniforms.hover||{value:-1};s.uniforms.uAssetMode=mode;
    s.vertexShader='attribute float buildingIndex; attribute float assetHeight; varying float vOwnedIndex; varying float vOwnedHeight;\n'+s.vertexShader;
    s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vOwnedIndex=buildingIndex;vOwnedHeight=assetHeight;');
    s.fragmentShader='uniform float uAssetSelected; uniform float uAssetHover; uniform float uAssetMode; varying float vOwnedIndex; varying float vOwnedHeight;\n'+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
     vec3 ownColor=uAssetMode<1.5?vec3(.70,.73,.58):mix(vec3(.40,.64,.68),vec3(.82,.68,.42),clamp(vOwnedHeight/105.,0.,1.));
     diffuseColor.rgb=mix(diffuseColor.rgb,ownColor,step(.5,uAssetMode)*.7);
     diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.48,.70,.35),(1.-step(.25,abs(vOwnedIndex-uAssetSelected)))*.22+(1.-step(.25,abs(vOwnedIndex-uAssetHover)))*.12);`);
   };m.customProgramCacheKey=()=>key()+'-r12-owned';
  });
  let disposed=false;asset.dispose=()=>{if(disposed)return;disposed=true;const ms=new Set();asset.traverse(m=>{if(m.isMesh){m.geometry.dispose();ms.add(m.material);}});for(const m of ms)m.dispose();asset.removeFromParent();};
  return asset;
 };
 return {materials,add,quad,box,plane,roof,wall,curtain,shell,finish,gray,baseY};
}
