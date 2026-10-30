import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {architectureBatch,stoneMaterial,glassMaterial,labelTexture} from './architecture-kit.js';
import {libraryAssetPlan,planCells,clipCell,cellBoundary,LIBRARY_OSM_ID} from './library-asset-plan.js';
import {bounds,pointSegment} from './geo.js';

// One owner for the library's visible shell, windows, roof courses and clock.
// No second generic extrusion, procedural window shader, road or terrain edit.
export function createLibraryAsset({building,baseY=1.1,buildingIndex=-1,uniforms={},stage='material'}={}){
 const plan=libraryAssetPlan(building),gray=stage==='massing';
 const materials={
  wall:stoneMaterial('#c8b2a2',.72),north:stoneMaterial('#c8ccc9',.72),
  glass:glassMaterial('#344c58'),frame:new THREE.MeshStandardMaterial({color:'#746f66',roughness:.66,metalness:.24}),
  roof:stoneMaterial('#89887c',.65),reveal:new THREE.MeshStandardMaterial({color:'#646660',roughness:1}),
  groundcover:new THREE.MeshStandardMaterial({color:'#647c45',roughness:1})
 };
 if(!gray){
  const pixels=new Uint8Array(64*64*4);let seed=20170407;
  for(let i=0;i<64*64;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=((seed>>>24)/255-.5)*24;pixels.set([164+n,182+n,130+n,255],i*4);}
  const turf=new THREE.DataTexture(pixels,64,64);turf.colorSpace=THREE.SRGBColorSpace;turf.wrapS=turf.wrapT=THREE.RepeatWrapping;turf.generateMipmaps=true;turf.minFilter=THREE.LinearMipmapLinearFilter;turf.magFilter=THREE.LinearFilter;turf.needsUpdate=true;materials.groundcover.map=turf;
  // Reuse the existing opaque glazing shader. A trial building-only cubemap
  // incurred a PMREM cold-start cost without a useful campus-scale benefit.
  materials.glass.metalness=.18;materials.glass.roughness=.24;
 }
 if(gray)for(const m of Object.values(materials)){m.color.set('#bebdb6');m.roughness=1;m.metalness=0;m.onBeforeCompile=()=>{};m.customProgramCacheKey=()=> 'library-r11-gray';}
 const batch=architectureBatch('Library R11 / single architectural owner',materials),detailBatch=architectureBatch('Library R12 / subpixel window detail',materials),partCounts={};
 const pending={main:{},detail:{}};
 const positions=(kind,vertices,uvs,detail=false)=>{
  const bucket=detail?pending.detail:pending.main,a=bucket[kind]||(bucket[kind]={p:[],uv:[]});a.p.push(...vertices);a.uv.push(...uvs);
  partCounts[kind]=(partCounts[kind]||0)+vertices.length/9;
 };
 const quad=(kind,points,uv=[[0,0],[0,1],[1,1],[1,0]],detail=kind==='reveal')=>{
  const ids=[0,1,2,0,2,3];positions(kind,ids.flatMap(i=>points[i]),ids.flatMap(i=>uv[i]),detail);
 };
 const wallRect=(kind,e,a,b,y0,y1,offset=0,detail=false)=>{
  if(b-a<.005||y1-y0<.005)return;
  const point=(s,y)=>[e.a[0]+e.ux*s+e.nx*offset,baseY+y,e.a[1]+e.uz*s+e.nz*offset];
  quad(kind,[point(a,y0),point(a,y1),point(b,y1),point(b,y0)],[[a,y0],[a,y1],[b,y1],[b,y0]],detail);
 };
 const strip=(kind,e,along,y,width,height,depth=.25,offset=0)=>{
  const geo=new THREE.BoxGeometry(width,height,depth);geo.rotateY(-Math.atan2(e.uz,e.ux));
  geo.translate(e.a[0]+e.ux*along+e.nx*offset,baseY+y+height/2,e.a[1]+e.uz*along+e.nz*offset);batch.add(kind,geo); // Curtain bays and cornices remain at every LOD.
 };
 const roof=(cells,y,kind='roof')=>{
  for(const ps of cells)for(let j=1;j<ps.length-1;j++){
   const t=[ps[0],ps[j+1],ps[j]];
   positions(kind,t.flatMap(p=>[p[0],baseY+y,p[1]]),t.flatMap(p=>[p[0]/6,p[1]/6]));
  }
 };
 function regularWall(e,bottom,top,rows,kind='wall',from=0,to=e.length,{narrowRows=[]}={}){
  if(gray){wallRect(kind,e,from,to,bottom,top);return;}
  const length=to-from,floor=(top-bottom)/rows;
  if(length<2.4||floor<2.2){wallRect(kind,e,from,to,bottom,top);return;}
  for(let row=0;row<rows;row++){
   const narrow=narrowRows.includes(row),count=Math.max(1,Math.floor(length/(narrow?1.65:3.5)));
   const bay=length/count,recess=narrow?.28:.11;
   const floorY=bottom+row*floor,low=floorY+Math.min(.85,floor*.23),high=floorY+floor-.48;
   wallRect(kind,e,from,to,floorY,low);wallRect(kind,e,from,to,high,floorY+floor);
   for(let col=0;col<count;col++){
   const x=from+col*bay,w=Math.min(narrow?.92:1.85,bay*(narrow?.56:.62)),left=x+(bay-w)/2,right=left+w;
   if(col===0)wallRect(kind,e,from,left,low,high);
   wallRect(kind,e,right,col===count-1?to:from+(col+1)*bay+(bay-w)/2,low,high);
   // Genuine apertures in the wall plane, with inset opaque glazing and reveals.
   wallRect('glass',e,left,right,low,high,-recess);
   const at=(s,y,o)=>[e.a[0]+e.ux*s+e.nx*o,baseY+y,e.a[1]+e.uz*s+e.nz*o];
   quad('reveal',[at(left,low,0),at(left,high,0),at(left,high,-recess-.01),at(left,low,-recess-.01)]);
   quad('reveal',[at(right,low,-recess-.01),at(right,high,-recess-.01),at(right,high,0),at(right,low,0)]);
   quad('reveal',[at(left,high,0),at(right,high,0),at(right,high,-recess-.01),at(left,high,-recess-.01)]);
   quad(kind,[at(left-.05,low-.06,-recess-.01),at(left-.05,low-.06,.09),at(right+.05,low-.06,.09),at(right+.05,low-.06,-recess-.01)],undefined,true);
   wallRect('frame',e,(left+right)/2-.035,(left+right)/2+.035,low,high,-recess+.03,true);
   }
  }
 }
 function curtain(e,bottom,top,from,to,{columns=8,north=false,rows=4}={}){
  const kind=north?'north':'wall';
  if(gray){wallRect(kind,e,from,to,bottom,top);return;}
  wallRect('glass',e,from,to,bottom+.22,top-.55,-.22);
  for(let i=0;i<=columns;i++)strip(north?kind:'frame',e,from+i*(to-from)/columns,bottom+.12,north?.65:.11,top-bottom-.5,north?.72:.18,north?.1:-.08);
  for(let i=1;i<rows;i++)strip(north?kind:'frame',e,(from+to)/2,bottom+i*(top-bottom)/rows-.14,to-from,north?.35:.11,.28,-.06);
  strip(kind,e,(from+to)/2,top-.52,to-from,.52,.85,.02);
 }
 const fronts=[];
 let southPortal=null;
 const southFacadeRibs=gray?null:{photoInformed:true,estimated:true,
  courses:['south-course-2','south-course-3','south-course-4'],countPerCourse:2,width:.62,depth:.66,
  reference:'library-front-2021.jpg (Liuxingy, CC BY-SA 4.0)'};
 const southNarrowBays=gray?null:{photoInformed:true,estimated:true,courses:['south-course-2','south-course-3'],
  rows:[0,1],approxWidth:.92,approxRecess:.28,approxBay:1.65,
  reference:'library-front-2021.jpg (Liuxingy, CC BY-SA 4.0)'};
 for(const zone of plan.zones){
  const isNorth=zone.id==='north-reading-block',isStack=zone.id==='north-book-stack';
  const kind=isNorth||isStack?'north':'wall';
  const boundary=cellBoundary(zone.cells),southEdges=zone.id==='south-II-podium'?boundary.filter(e=>e.nz>.9&&Math.max(e.a[1],e.b[1])>-76):[];
  const southMin=Math.min(...southEdges.flatMap(e=>[e.a[0],e.b[0]])),southMax=Math.max(...southEdges.flatMap(e=>[e.a[0],e.b[0]])),southMid=(southMin+southMax)/2;
  for(const e of boundary){
   if(zone.top===13&&plan.internalSeams.some(([a,b])=>[e.a,e.b].every(p=>pointSegment(p,a,b).distance<.002)))continue;
   const northFront=isNorth&&e.nz<-.9&&Math.min(e.a[1],e.b[1])<-218;
   const southFront=zone.id==='south-II-podium'&&e.nz>.9&&Math.max(e.a[1],e.b[1])>-76;
   if(northFront){
    const mid=(plan.centerX-e.a[0])/e.ux,half=19;
    regularWall(e,zone.bottom,zone.top,zone.rows,kind,0,mid-half);
    curtain(e,zone.bottom,zone.top,mid-half,mid+half,{north:true});
    regularWall(e,zone.bottom,zone.top,zone.rows,kind,mid+half,e.length);
    fronts.push({kind:'north',edge:e,mid,y:zone.top-2.3});
   }else if(southFront){
    const start=Math.abs(e.a[0]-southMax)<.01?1.3:0,end=Math.abs(e.b[0]-southMin)<.01?e.length-1.3:e.length;
    curtain(e,0,11.9,start,end,{columns:Math.max(1,Math.round((end-start)/3.4)),rows:zone.rows});
    wallRect(kind,e,0,start,0,13);wallRect(kind,e,end,e.length,0,13);
    wallRect(kind,e,start,end,11.9,13);
    if(Math.min(e.a[0],e.b[0])<=southMid&&Math.max(e.a[0],e.b[0])>southMid){
     const mid=(southMid-e.a[0])/e.ux;
     fronts.push({kind:'south',edge:e,mid,y:12.48});
     if(!gray){
      // The 2021 front photograph shows a central, recessed glazed entrance
      // beneath the name band. Dimensions and door divisions are estimated,
      // not surveyed. Keep the detail in the existing wall/glass/frame batches.
      const jamb=1.7,portalHeight=3.9;
      wallRect('glass',e,mid-1.49,mid+1.49,.27,3.48,.08);
      for(const s of [-1,1])strip('wall',e,mid+s*jamb,.15,.42,3.6,.58,.27);
      strip('wall',e,mid,3.48,3.82,.42,.58,.27);
      for(const s of [-1,1])strip('frame',e,mid+s*1.48,.27,.10,3.18,.18,.27);
      strip('frame',e,mid,.27,.10,3.18,.18,.27);
      strip('frame',e,mid,3.32,3.03,.12,.18,.27);
      southPortal={photoInformed:true,estimated:true,width:jamb*2,height:portalHeight,
       center:[e.a[0]+e.ux*mid,baseY,e.a[1]+e.uz*mid],
       reference:'library-front-2021.jpg (Liuxingy, CC BY-SA 4.0)'};
     }
    }
   }else if(zone.rect&&zone.glass&&e.nz>.9&&Math.abs(e.a[1]-zone.rect[3])<.02&&Math.min(e.a[0],e.b[0])<plan.centerX&&Math.max(e.a[0],e.b[0])>plan.centerX){
    const mid=(plan.centerX-e.a[0])/e.ux,half=Math.min(zone.glass/2,e.length/2-.2);
    // Paired photo-informed narrow rows in the two middle tiers; crown and unseen sides retain R12 detail.
    const narrowSouthWing=!gray&&['south-course-2','south-course-3'].includes(zone.id)?{narrowRows:[0,1]}:undefined;
    regularWall(e,zone.bottom,zone.top,zone.rows,kind,0,mid-half,narrowSouthWing);
    curtain(e,zone.bottom,zone.top,mid-half,mid+half,{columns:4,rows:zone.rows});
    // The 2021 frontal reference shows prominent light stone verticals
    // breaking the dark central glazing. Physical piers, not shader decoration;
    // their exact spacing and depth are photo-informed estimates.
    if(!gray&&['south-course-2','south-course-3','south-course-4'].includes(zone.id)){
     for(const side of [-1,1])strip('wall',e,mid+side*half*.5,zone.bottom+.35,.62,zone.top-zone.bottom-.9,.66,.27);
    }
    regularWall(e,zone.bottom,zone.top,zone.rows,kind,mid+half,e.length,narrowSouthWing);
   }else{
    regularWall(e,zone.bottom,zone.top,zone.rows,kind);
   }
   if(!gray)strip(kind,e,e.length/2,zone.top-.22,e.length,.25,.42,-.04);
  }
  if(zone.section){roof(zone.cells,zone.top,gray?'roof':'groundcover');
  }else if(zone.id==='south-II-podium'){
   const inner=plan.courses[0].rect;
   const bb=[-1e4,-1e4,1e4,1e4];
   for(const r of [[bb[0],bb[1],inner[0],bb[3]],[inner[2],bb[1],bb[2],bb[3]],[inner[0],bb[1],inner[2],inner[1]],[inner[0],inner[3],inner[2],bb[3]]])roof(planCells(zone.points,r),zone.top);
  }else if(zone.rect){
   const next=plan.courses[plan.courses.indexOf(zone)+1];
   if(next){const a=zone.rect,b=next.rect;
    for(const r of [[a[0],a[1],b[0],a[3]],[b[2],a[1],a[2],a[3]],[b[0],a[1],b[2],b[1]],[b[0],b[3],b[2],a[3]]]){
     const cells=planCells(zone.points,r);roof(cells,zone.top,!gray&&zone.id!=='south-course-4'?'groundcover':'roof');
    }
   }else roof(zone.cells,zone.top);
  }else{
   // Both north reading block and T-shaped stack have pitched roofs in the
   // licensed 2025 aerial. The modest pitch is illustrative, not a roof survey.
   // A clipped distance-to-eaves surface replaces their old flat roof; it adds
   // neither floors nor any geometry outside the retained mapped outline.
   const bb=bounds(zone.points),edges=cellBoundary(zone.cells),rise=isNorth?1.5:1.05;
   const height=p=>zone.top+Math.min(rise,Math.min(...edges.map(e=>pointSegment(p,e.a,e.b).distance))*.15);
   for(let x=bb[0];x<bb[2];x+=4)for(let z=bb[1];z<bb[3];z+=4){
    for(const ps of zone.cells.map(c=>clipCell(c,[x,z,Math.min(x+4,bb[2]),Math.min(z+4,bb[3])])).filter(c=>c.length>2))
     for(let j=1;j<ps.length-1;j++){const t=[ps[0],ps[j+1],ps[j]];positions('roof',t.flatMap(p=>[p[0],baseY+height(p),p[1]]),t.flatMap(p=>[p[0]/6,p[1]/6]));}
   }
  }
 }
 // Existing 2025 aerial evidence shows groundcover on the two broad rear wings.
 // Keep the original footprint polygons and 13m support height; no landscaping
 // or courtyard earthworks are introduced by this asset.
 // Supported clock: its old generic 12x7x13m box and duplicate round face are
 // not part of this model. North and south faces are visible in the references.
 const cx=plan.centerX,cz=plan.steppedCenterZ+6.5;
 batch.box('roof',cx,baseY+42.75,cz,5.8,.7,4.3);
 batch.box('wall',cx,baseY+43.45,cz,4.7,4.2,3.25);
 batch.box('roof',cx,baseY+47.65,cz,5.2,.35,3.8);
 const cap=new THREE.ConeGeometry(2.9,1.18,4);cap.rotateY(Math.PI/4);cap.translate(cx,baseY+48.59,cz);batch.add('roof',cap);
 const finial=new THREE.CylinderGeometry(.12,.17,.57,8);finial.translate(cx,baseY+49.465,cz);batch.add('frame',finial);
 for(const [bucket,target] of [[pending.main,batch],[pending.detail,detailBatch]])for(const [kind,a] of Object.entries(bucket)){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a.p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(a.uv,2));g.computeVertexNormals();target.add(kind,g);
 }
 const asset=batch.finish(),details=detailBatch.finish();
 // Keep one mesh per material. Details form a contiguous suffix, so far LOD
 // trims drawRange without an extra near draw call or a second material owner.
 for(const mesh of [...details.children]){
  const main=asset.children.find(m=>m.material===mesh.material);
  if(main){
   const start=main.geometry.attributes.position.count,g=mergeGeometries([main.geometry,mesh.geometry],false);
   main.geometry.dispose();mesh.geometry.dispose();mesh.removeFromParent();main.geometry=g;
   g.computeBoundingBox();g.computeBoundingSphere();main.userData.libraryDetailStart=start;main.userData.libraryDetail=true;
  }else{mesh.userData.libraryDetailStart=0;mesh.userData.libraryDetail=true;asset.add(mesh);}
 }
 asset.name='Qian Xuesen Library R12 / complete owned asset';
 for(const m of asset.children){m.userData.part=m.name.split('/').at(-1).trim();}
 if(!gray){
  for(const f of fronts){
   const text=f.kind==='north'?'图书馆':'钱学森图书馆';
   const map=labelTexture(text,{background:f.kind==='north'?'#344c58':'#c4b9a7',color:f.kind==='north'?'#c2a357':'#33312d'});
   if(map){const e=f.edge,mesh=new THREE.Mesh(new THREE.PlaneGeometry(f.kind==='north'?10:25,1.25),new THREE.MeshStandardMaterial({map,roughness:.82}));
    mesh.position.set(e.a[0]+e.ux*f.mid+e.nx*.18,baseY+f.y,e.a[1]+e.uz*f.mid+e.nz*.18);
    mesh.rotation.y=Math.atan2(e.nx,e.nz);mesh.name='Library R11 / '+f.kind+' name / generated lettering';asset.add(mesh);
   }
  }
  if(typeof document!=='undefined'){
   const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
   c.fillStyle='#d6d0bd';c.fillRect(0,0,256,256);c.strokeStyle='#3e433f';c.lineWidth=6;c.strokeRect(5,5,246,246);
   for(let i=0;i<12;i++){const a=i*Math.PI/6;c.beginPath();c.moveTo(128+Math.sin(a)*84,128-Math.cos(a)*84);c.lineTo(128+Math.sin(a)*103,128-Math.cos(a)*103);c.stroke();}
   c.lineWidth=8;c.beginPath();c.moveTo(128,53);c.lineTo(128,128);c.lineTo(178,151);c.stroke();
   const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
   const m=new THREE.MeshStandardMaterial({map,roughness:.85});
   for(const side of [-1,1]){const face=new THREE.Mesh(new THREE.PlaneGeometry(3.9,3.5),m);face.position.set(cx,baseY+45.55,cz+side*1.63);face.rotation.y=side<0?Math.PI:0;face.name='Library R11 / '+(side<0?'north':'south')+' clock face';asset.add(face);}
  }
 }
 const mode={value:0},modeColor={value:new THREE.Color('#dbc080')};
 asset.setColorMode=value=>{mode.value=value==='natural'?0:1;modeColor.value.set(value==='category'?'#dbc080':'#6297b9');};
 asset.traverse(mesh=>{
  if(!mesh.isMesh)return;mesh.userData.place=building;mesh.userData.buildingIndex=buildingIndex;mesh.userData.libraryOwner='library-asset.js';
  const m=mesh.material;if(gray||m.userData.libraryR11Shader)return;m.userData.libraryR11Shader=true;
  const previous=m.onBeforeCompile,previousKey=m.customProgramCacheKey.bind(m);
  m.onBeforeCompile=shader=>{
   previous(shader);shader.uniforms.uLibSelected=uniforms.selection||{value:-1};shader.uniforms.uLibHover=uniforms.hover||{value:-1};shader.uniforms.uLibMode=mode;shader.uniforms.uLibModeColor=modeColor;shader.uniforms.uLibNight=uniforms.night||{value:0};
   shader.fragmentShader='uniform float uLibSelected; uniform float uLibHover; uniform float uLibMode; uniform float uLibNight; uniform vec3 uLibModeColor;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\n diffuseColor.rgb=mix(diffuseColor.rgb,uLibModeColor,uLibMode*.7);\n float libSelected=1.-step(.25,abs(uLibSelected-${buildingIndex.toFixed(1)}));\n float libHovered=1.-step(.25,abs(uLibHover-${buildingIndex.toFixed(1)}));\n float libFocus=clamp(libSelected*.72+libHovered*.32,0.,1.);\n diffuseColor.rgb*=1.0+libSelected*.012+libHovered*.006;`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n float libFresnel=pow(1.0-saturate(dot(normalize(vNormal),normalize(vViewPosition))),2.4);\n totalEmissiveRadiance+=vec3(.22,.14,.065)*libFresnel*libFocus;');
   if(!gray&&m===materials.glass)shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance+=vec3(.22,.16,.08)*uLibNight;');
  };m.customProgramCacheKey=()=>previousKey()+'-library-r16-focus-'+buildingIndex;
 });
 asset.userData={owner:'library-asset.js',version:'R12',osmId:LIBRARY_OSM_ID,buildingId:building.id,stage,plan,southPortal,southFacadeRibs,southNarrowBays,
  ownership:{structure:'this asset',facade:'this asset',clock:'this asset',greenRoofs:'this asset',forecourt:'existing library-forecourt.js; unchanged'},
  retiredVisuals:['generic buildingMesh library faces','world.addClock library plane','libraryFacade','libraryClock','libraryGreenRoofs','buildingSilhouettes northLibrary'],
  estimated:true,entrances:fronts.map(f=>({side:f.kind,center:[f.edge.a[0]+f.edge.ux*f.mid,baseY+f.y,f.edge.a[1]+f.edge.uz*f.mid]})),sourceDates:['2016-11-21','2017-05-18','2021-09-06','2025-07-25'],
  licensing:'Original procedural geometry/materials/lettering; source photos not used as textures',
  measurements:{triangles:asset.children.filter(m=>m.isMesh).reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0),meshes:asset.children.length},partCounts};
 const bb=bounds(building.points),lodBox=new THREE.Box3(new THREE.Vector3(bb[0],baseY,bb[1]),new THREE.Vector3(bb[2],baseY+plan.maxHeight,bb[3])),detailMeshes=asset.children.filter(m=>m.userData.libraryDetail);
 const lod={detailVisible:detailMeshes.length>0,projectedThicknessPixels:null,thicknessMetres:.12,enterPixels:.85,exitPixels:.55};asset.userData.detailLOD=lod;
 asset.updateDetailLOD=(camera,viewportPixels)=>{
  const distance=Math.max(1,lodBox.distanceToPoint(camera.position)),pixels=.12*Math.max(1,viewportPixels)*camera.projectionMatrix.elements[5]/(2*distance);
  const visible=detailMeshes.length>0&&(lod.detailVisible?pixels>.55:pixels>.85);lod.projectedThicknessPixels=pixels;
  if(visible!==lod.detailVisible){for(const mesh of detailMeshes){mesh.visible=visible||mesh.userData.libraryDetailStart>0;mesh.geometry.setDrawRange(0,visible?Infinity:mesh.userData.libraryDetailStart);}lod.detailVisible=visible;}return visible;
 };
 let disposed=false;
 asset.dispose=()=>{if(disposed)return;disposed=true;const geos=new Set(),mats=new Set(),textures=new Set();asset.traverse(m=>{if(!m.isMesh)return;geos.add(m.geometry);mats.add(m.material);for(const v of Object.values(m.material))if(v?.isTexture)textures.add(v);});for(const x of geos)x.dispose();for(const x of mats)x.dispose();for(const x of textures)x.dispose();asset.removeFromParent();};
 return asset;
}
