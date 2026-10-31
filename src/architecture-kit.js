import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {boxGeometry} from './geo.js';

// Campus-specific static geometry, batched by material. Dimensions inferred from
// photographs are kept separate from the unchanged OSM footprint database.
export function architectureBatch(name,materials){
 const group=new THREE.Group();group.name=name;
 const parts=Object.fromEntries(Object.keys(materials).map(k=>[k,[]]));
 const add=(kind,geo)=>{if(!parts[kind])throw Error('Unknown architecture material '+kind);parts[kind].push(geo.index?geo.toNonIndexed():geo);};
 const box=(kind,x,y,z,w,h,d)=>{
  if([x,y,z,w,h,d].some(v=>!Number.isFinite(v))||Math.min(w,h,d)<=0)throw Error('Invalid architectural dimension');
  add(kind,boxGeometry(x,y,z,w,h,d));
 };
 const beam=(kind,a,b,r=.10)=>{
  const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),delta=to.clone().sub(from);
  const geo=new THREE.CylinderGeometry(r,r,delta.length(),6);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));geo.translate(...from.add(to).multiplyScalar(.5).toArray());add(kind,geo);
 };
 const finish=()=>{
  for(const [kind,geos] of Object.entries(parts)){
   if(!geos.length)continue;
   const geometry=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());
   geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const mesh=new THREE.Mesh(geometry,materials[kind]);mesh.name=name+' / '+kind;
   mesh.castShadow=kind!=='glass';mesh.receiveShadow=true;group.add(mesh);
  }
  return group;
 };
 return{group,add,box,beam,finish};
}

export function stoneMaterial(color,scale=1.15,{jointWidth=.015,jointContrast=.05}={}){
 const m=new THREE.MeshStandardMaterial({color,roughness:.84});
 m.onBeforeCompile=s=>{
  s.vertexShader='varying vec3 vStonePos;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvStonePos=(modelMatrix*vec4(transformed,1.)).xyz;');
  s.fragmentShader='varying vec3 vStonePos;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 tileCoord=vec2(vStonePos.x+vStonePos.z,vStonePos.y)*${scale.toFixed(3)};
   vec2 tileCell=fract(tileCoord);vec2 aa=max(fwidth(tileCoord),vec2(.001));
   vec2 joints=smoothstep(vec2(${jointWidth.toFixed(3)})-aa,vec2(${jointWidth.toFixed(3)})+aa,min(tileCell,1.-tileCell));
   float grain=fract(sin(dot(floor(tileCoord),vec2(12.9898,78.233)))*43758.5453);
   diffuseColor.rgb*=.95+grain*.08;diffuseColor.rgb*=${(1-jointContrast).toFixed(3)}+${jointContrast.toFixed(3)}*min(joints.x,joints.y);
  `);
 };m.customProgramCacheKey=()=>`campus-stone-${scale}${jointWidth!==.015||jointContrast!==.05?'-west1-tiles-'+jointWidth+'-'+jointContrast:''}`;return m;
}

export function glassMaterial(color='#36525e'){
 const m=new THREE.MeshStandardMaterial({color,metalness:.32,roughness:.27,emissive:'#142735',emissiveIntensity:.08});
 // Opaque architectural glazing avoids sorting, overdraw and transmission buffers.
 m.onBeforeCompile=s=>{
  s.vertexShader='varying vec3 vGlassWorld;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvGlassWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
  s.fragmentShader='varying vec3 vGlassWorld;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float band=.5+.5*sin(vGlassWorld.y*.13+vGlassWorld.x*.045);
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.32,band*.32);
  `);
 };m.customProgramCacheKey=()=> 'campus-glass-2';return m;
}

export function labelTexture(text,{width=1024,height=128,background='#d1c8b8',color='#252c2e',vertical=false}={}){
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const c=canvas.getContext('2d');c.fillStyle=background;c.fillRect(0,0,width,height);c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';
 if(vertical){c.font=`${Math.floor(width*.7)}px KaiTi,STKaiti,serif`;[...text].forEach((letter,i)=>c.fillText(letter,width/2,height*(i+.5)/text.length));}
 else{c.font=`${Math.floor(height*.65)}px KaiTi,STKaiti,"Microsoft YaHei",serif`;c.fillText(text,width/2,height*.53,width*.94);}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}
