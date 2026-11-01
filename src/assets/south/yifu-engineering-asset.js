import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {planCells,cellBoundary} from '../../library-asset-plan.js';
export const YIFU_ENGINEERING_ID=263632772;
export const YIFU_REFERENCE='https://you.ctrip.com/sight/xian7/1475829.html';
// Photo lettering wraps around the curved fascia, not a floating flat sign.
export function createCurvedFasciaLetteringGeometry({face,center,radius,baseY=1.1,index,height}){
 if(!face||!Number.isFinite(radius)||radius<=0)throw Error('Invalid Yifu fascia dimensions');
 const segments=24,p=[],uv=[],ids=[],hs=[];
 const at=(angle,y)=>[
  face.a[0]+face.ux*(center+radius*Math.sin(angle))+face.nx*radius*Math.cos(angle),
  baseY+y,
  face.a[1]+face.uz*(center+radius*Math.sin(angle))+face.nz*radius*Math.cos(angle)
 ];
 const first=-Math.PI*.28,last=Math.PI*.28,low=3.94,high=4.64;
 for(let i=0;i<segments;i++){
  const a=first+(last-first)*i/segments,b=first+(last-first)*(i+1)/segments;
  const vertices=[
   [at(a,low),1-i/segments,0],[at(a,high),1-i/segments,1],
   [at(b,high),1-(i+1)/segments,1],[at(b,low),1-(i+1)/segments,0]
  ];
  for(const k of [0,1,2,0,2,3]){
   p.push(...vertices[k][0]);uv.push(vertices[k][1],vertices[k][2]);
   ids.push(index);hs.push(height);
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 g.setAttribute('buildingIndex',new THREE.Float32BufferAttribute(ids,1));
 g.setAttribute('assetHeight',new THREE.Float32BufferAttribute(hs,1));
 g.computeVertexNormals();
 return g;
}
function nameTexture(){
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=1000;c.height=180;const g=c.getContext('2d');
 g.clearRect(0,0,c.width,c.height);g.fillStyle='#dfbf79';g.font='bold 142px "Microsoft YaHei",serif';
 g.textAlign='center';g.textBaseline='middle';g.fillText('逸夫工程馆',500,94,960);
 const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;return tx;
}
export function createYifuEngineeringAsset({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 if(building?.osmId!==YIFU_ENGINEERING_ID)throw Error('Expected OSM 263632772');
 if(!Number.isInteger(buildingIndex)||buildingIndex<0)throw Error('Invalid building index');
 const index=buildingIndex,h=building.height,cells=planCells(building.points),edges=cellBoundary(cells);
 const face=edges.filter(e=>e.length>=10).sort((a,b)=>(b.a[1]+b.b[1])-(a.a[1]+a.b[1]))[0];
 if(!face)throw Error('Yifu candidate facade not found');
 const b=ownedArchitecture('Yifu Engineering Hall photo-informed entrance',{baseY,uniforms,stage,
  extraMaterials:{metal:new THREE.MeshStandardMaterial({color:'#929b9e',metalness:.58,roughness:.42,side:THREE.DoubleSide}),
  gold:new THREE.MeshStandardMaterial({color:'#bca16b',metalness:.65,roughness:.38}),
  steps:new THREE.MeshStandardMaterial({color:'#aba9a4',roughness:.92,side:THREE.DoubleSide})}});
 if(!b.gray){
  b.materials.stone.color.set('#c2b8ad');b.materials.glass.color.set('#5c7581');
  b.materials.frame.color.set('#999e9d');b.materials.roof.color.set('#acaaa5');
  b.materials.metal.color.set('#a1a7a8');
  b.materials.glass.side=THREE.DoubleSide;
 }
 const L=face.length,c=L*.50,R=Math.min(L*.28,5.2),u0=c-R,u1=c+R;
 const glassR=R-.14,fasciaR=R+.56;
 const bands={entryDoorTop:3.48,canopyBottom:3.82,canopyTop:4.72,upperCurtainBottom:4.78,upperCurtainTop:Math.min(11.55,h-.40)};
 const p=(u,out,y)=>[face.a[0]+face.ux*u+face.nx*out,baseY+y,face.a[1]+face.uz*u+face.nz*out];
 const curve=(theta,radius,y)=>p(c+radius*Math.sin(theta),radius*Math.cos(theta),y);
 const segmentCount=20;
 // Unphotographed faces remain blank, without invented window rhythms.
 for(const e of edges)if(e!==face)b.plane('stone',e,0,e.length,0,h,index,h);
 b.plane('stone',face,0,u0,0,h,index,h);
 b.plane('stone',face,u1,L,0,h,index,h);
 b.plane('stone',face,u0,u1,bands.upperCurtainTop,h,index,h);
 // The photograph shows recessed planar double doors BEHIND the canopy.
 const from=u0+.42,to=u1-.42;
 b.plane('glass',face,from,to,.28,bands.entryDoorTop,index,h,-.15);
 for(const x of [from,c-.9,c,c+.9,to])b.plane('frame',face,x-.046,x+.046,.28,bands.entryDoorTop,index,h,-.06);
 for(const y of [.29,bands.entryDoorTop])b.plane('frame',face,from,to,y-.045,y+.045,index,h,-.06);
 b.plane('stone',face,u0,u1,bands.entryDoorTop,bands.canopyBottom,index,h);
 // The curved glazed bay belongs ABOVE the opaque metal fascia, not under it.
 for(let i=0;i<segmentCount;i++){
  const a=-Math.PI/2+Math.PI*i/segmentCount,d=-Math.PI/2+Math.PI*(i+1)/segmentCount;
  b.quad('glass',[curve(a,glassR,bands.upperCurtainBottom),curve(a,glassR,bands.upperCurtainTop),
    curve(d,glassR,bands.upperCurtainTop),curve(d,glassR,bands.upperCurtainBottom)],index,h);
  b.quad('metal',[curve(a,fasciaR,bands.canopyBottom),curve(a,fasciaR,bands.canopyTop),
    curve(d,fasciaR,bands.canopyTop),curve(d,fasciaR,bands.canopyBottom)],index,h);
  b.quad('metal',[curve(a,fasciaR,bands.canopyTop),curve(a,glassR,bands.canopyTop),
    curve(d,glassR,bands.canopyTop),curve(d,fasciaR,bands.canopyTop)],index,h);
  b.quad('metal',[curve(a,fasciaR,bands.canopyBottom),curve(a,glassR,bands.canopyBottom),
    curve(d,glassR,bands.canopyBottom),curve(d,fasciaR,bands.canopyBottom)],index,h);
  for(const y of [6.9,9.1])b.quad('frame',[
    curve(a,glassR+.025,y-.05),curve(a,glassR+.025,y+.05),
    curve(d,glassR+.025,y+.05),curve(d,glassR+.025,y-.05)
  ],index,h);
 }
 for(let i=0;i<=segmentCount;i++){
  const theta=-Math.PI/2+Math.PI*i/segmentCount;
  b.quad('frame',[curve(theta-.022,glassR+.028,bands.upperCurtainBottom),curve(theta-.022,glassR+.028,bands.upperCurtainTop),
    curve(theta+.022,glassR+.028,bands.upperCurtainTop),curve(theta+.022,glassR+.028,bands.upperCurtainBottom)],index,h);
 }
 // Curved, nested treads. Radii and heights are derived visually, not surveyed.
 const stepRadii=[.23,1.04,1.85,2.66].map(x=>fasciaR+x);
 for(let step=0;step<stepRadii.length;step++){
  const inner=stepRadii[step],outer=inner+.81,top=.59-step*.13;
  for(let i=0;i<segmentCount;i++){
   const a=-Math.PI/2+Math.PI*i/segmentCount,d=-Math.PI/2+Math.PI*(i+1)/segmentCount;
   b.quad('steps',[curve(a,inner,top),curve(a,outer,top),
     curve(d,outer,top),curve(d,inner,top)],index,h);
   b.quad('steps',[curve(a,outer,.01),curve(a,outer,top),
     curve(d,outer,top),curve(d,outer,.01)],index,h);
  }
 }
 b.roof(cells,h,index,h);
 const model=b.finish({owner:'src/assets/south/yifu-engineering-asset.js',
  osmIds:[YIFU_ENGINEERING_ID],photoSource:YIFU_REFERENCE,
  photoLicense:'third-party-reference-only',heightStatus:'unmeasured-osm-estimate',
  entranceOrientationStatus:'unverified',roofStatus:'unknown-flat-placeholder',
  photoArchitectureVersion:2,photoSections:bands,stepRadii,
  confirmedFeatures:['curved-glass-vestibule','curved-metal-canopy','entrance-steps','gold-building-lettering',
   'upper-curved-glass-curtain-wall','recessed-rectangular-glass-entrance','curved-stepped-approach','gold-sign-on-curved-metal-fascia'],
  sourceDataUnchanged:true,geometryStatus:'photo-relative bands and curved fascia lettering; heights/radii/azimuth unverified',
  front:{center:p(c,fasciaR,4),normal:[face.nx,face.nz],tangent:[face.ux,face.uz]}});
 const tex=stage==='massing'?null:nameTexture();
 if(tex){
  const g=createCurvedFasciaLetteringGeometry({face,center:c,radius:fasciaR+.095,baseY,index,height:h});
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
  m.userData.buildingAssetMesh=true;m.userData.owner='src/assets/south/yifu-engineering-asset.js';
  m.name='Yifu curved fascia lettering';model.add(m);
  const cleanup=model.dispose;model.dispose=()=>{cleanup();tex.dispose();};
 }
 return model;
}
