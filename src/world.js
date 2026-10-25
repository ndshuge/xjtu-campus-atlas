import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createLibraryFacade} from './library-facade.js';
import {createMainTowerFacade} from './main-tower-facade.js';
import {makeGroundPattern} from './ground-pattern.js';
import {makeCanopyTexture} from './foliage-texture.js';
import {createSurfaceTexture} from './surface-textures.js';
import {findSafeWalkStart} from './walk-placement.js';
import {createFourInventionsMarker} from './four-inventions.js';
import {createNorthGate} from './north-gate.js';
import {Sky} from 'three/addons/objects/Sky.js';
import {BASE,shape,flat,extrude,pointIn,pointSegment,bounds,ribbon,rng,boxGeometry,rectangle} from './geo.js';

const PALETTE={academic:'#e3d9bd',living:'#d9bca1',culture:'#e7e2ce',sports:'#d9d7ba',service:'#d1c7a7'};
const CATEGORY={academic:'#96bfc1',living:'#dfb391',culture:'#dbc080',sports:'#9ab483',service:'#c9a5ba'};
const SKY={day:'#d8e4de',dusk:'#c6bdba',night:'#1b303b'};

export class CampusWorld{
 constructor(container,data,{select,notify,changeMode,ready}){
  this.data=data;this.onSelect=select;this.notify=notify;this.onMode=changeMode;this.container=container;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.isMobile=matchMedia('(max-width: 768px)').matches;this.keys=new Set();this.mode='orbit';this.auto=false;this.tour=null;this.selected=-1;this.hovered=-1;this.lightMode='day';this.night={value:0};this.selection={value:-1};this.hover={value:-1};this.time={value:0};this.colorMode={value:0};this.labelsEnabled=true;this.frames=0;this.fps=0;this.frameTimes=[];this.startTime=performance.now();this.geos=[];this.labelItems=[];this.pickables=[];
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(SKY.day);this.scene.fog=new THREE.Fog(SKY.day,1800,4100);
  try{this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:this.isMobile?'default':'high-performance',preserveDrawingBuffer:!this.isMobile,alpha:false});}catch(e){throw Error('WebGL 2 unavailable: '+e.message);}
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.isMobile?1.5:1.8));this.renderer.setSize(innerWidth,innerHeight);this.renderer.shadowMap.enabled=!this.isMobile;this.renderer.shadowMap.type=THREE.PCFShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.06;this.renderer.outputColorSpace=THREE.SRGBColorSpace;container.appendChild(this.renderer.domElement);
  this.camera=new THREE.PerspectiveCamera(39,innerWidth/innerHeight,.6,6000);this.camera.position.set(950,1040,1270);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(30,0,-55);this.controls.enableDamping=true;this.controls.dampingFactor=.075;this.controls.minDistance=35;this.controls.maxDistance=2450;this.controls.maxPolarAngle=Math.PI*.485;this.controls.minPolarAngle=.06;this.controls.zoomSpeed=.65;this.controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};this.controls.panSpeed=.7;this.controls.autoRotateSpeed=.35;this.controls.screenSpacePanning=false;this.controls.listenToKeyEvents(window);
  this.hemi=new THREE.HemisphereLight('#e4f0ec','#777e60',1.75);this.scene.add(this.hemi);
  this.sun=new THREE.DirectionalLight('#fff0cf',2.6);this.sun.position.set(-650,1000,450);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-760,right:850,top:830,bottom:-730,near:10,far:2700});this.sun.shadow.bias=-.00016;this.sun.shadow.normalBias=.55;this.scene.add(this.sun);
  this.fill=new THREE.DirectionalLight('#c5dfe6',.6);this.fill.position.set(600,300,-700);this.scene.add(this.fill);
  this.sky=new Sky();this.sky.scale.setScalar(4600);this.sky.material.depthWrite=false;this.sky.visible=!this.isMobile;this.scene.add(this.sky);
  const skyUniforms=this.sky.material.uniforms;skyUniforms.turbidity.value=3;skyUniforms.rayleigh.value=.85;skyUniforms.mieCoefficient.value=.003;skyUniforms.mieDirectionalG.value=.78;skyUniforms.sunPosition.value.copy(this.sun.position);
  this.pavers=createSurfaceTexture('pavers');this.asphalt=createSurfaceTexture('asphalt');this.waterTexture=createSurfaceTexture('water');
  this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.proj=new THREE.Vector3();this.timer=new THREE.Timer();this.timer.connect(document);this.dimensions=new Map();this.footprintBounds=data.buildings.map(b=>bounds(b.points));
  this.buildGround();this.buildSurfaces();this.buildRoads();this.buildBuildings();this.buildLandmarks();this.buildTrees();this.buildFurniture();this.buildLabels();this.bind();this.resize();this.home(false);this.animate();
  requestAnimationFrame(()=>{this.loadMs=performance.now()-this.startTime;ready?.();});
 }
 mat(color,options={}){return new THREE.MeshStandardMaterial({color,roughness:.9,metalness:0,...options});}
 mesh(g,m,{cast=false,receive=true,parent=this.scene}={}){if(!g)return null;const o=new THREE.Mesh(g,m);o.castShadow=cast;o.receiveShadow=receive;parent.add(o);return o;}
 merge(gs,mat,opts={}){gs=gs.filter(Boolean);if(!gs.length)return null;const g=mergeGeometries(gs,false);if(!g)throw Error('Geometry batch failed');gs.forEach(g=>g.dispose());return this.mesh(g,mat,opts);}
 buildGround(){
  this.ground=this.mesh(new THREE.PlaneGeometry(14000,14000),this.mat('#b7c6b4'));this.ground.rotation.x=-Math.PI/2;this.ground.position.y=-4;
  const gs=this.data.boundary.map(p=>extrude(p,4,-3));this.campusBase=this.merge(gs,this.mat('#d5d5bc'));
  const edges=[];for(const p of this.data.boundary){const vs=p.map(v=>new THREE.Vector3(v[0],BASE+.15,v[1]));edges.push(...vs.flatMap((v,i)=>i<vs.length-1?[v,vs[i+1]]:[]));}
  this.scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(edges),new THREE.LineBasicMaterial({color:'#899d7d',transparent:true,opacity:.75})));
 }
 buildSurfaces(){
  const groups={wood:[],green:[],water:[],pitch:[],plaza:[]};
  for(const s of this.data.surfaces){if(s.kind==='pitch')this.buildPitch(s);else groups[s.kind].push(flat(s.points,BASE+.02));if(s.name){const hit=this.mesh(flat(s.points,BASE+.13),new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide}),{receive:false});hit.userData.place={...s,position:s.center,category:s.kind==='pitch'?'sports':'culture',categoryName:s.kind==='pitch'?'运动场地':'校园景观',description:'边界与名称来自 OSM；设施与场地纹理为程序化示意。'};this.pickables.push(hit);}}
  this.groundPattern=makeGroundPattern();this.merge(groups.green,this.mat('#a4bd91',{map:this.groundPattern}));this.merge(groups.wood,this.mat('#a5bc90',{map:this.groundPattern}));this.merge(groups.plaza,this.mat('#dbd9c7',{map:this.pavers}));
  this.waterMaterial=this.mat('#85afa7',{roughness:.24,metalness:.20,map:this.waterTexture});this.merge(groups.water,this.waterMaterial);
  const shoreline=[];for(const s of this.data.surfaces.filter(s=>s.kind==='water'))for(let i=0;i<s.points.length;i++){const a=s.points[i],b=s.points[(i+1)%s.points.length];if(Math.hypot(b[0]-a[0],b[1]-a[1])>.1)shoreline.push(ribbon([a,b],.85,BASE+.089));}
  this.merge(shoreline,this.mat('#b6bdac',{roughness:.84}));
  this.merge(groups.pitch,this.mat('#748e63'));
 }
 buildPitch(s){const [x0,z0,x1,z1]=bounds(s.points),cx=(x0+x1)/2,cz=(z0+z1)/2,w=x1-x0,d=z1-z0;let pos=[];
  // Each pitch owns exactly one base; avoid drawing a coincident generic surface.
  if(s.name!=='东田径场')this.mesh(flat(s.points,BASE+.065),this.mat(s.sport==='soccer'?'#789963':'#80986a'));
  const line=(a,b)=>pos.push(a[0],BASE+.22,a[1],b[0],BASE+.22,b[1]);
  const rect=(x,z,rw,rd)=>{const p=rectangle(x,z,rw,rd);for(let i=1;i<p.length;i++)line(p[i-1],p[i]);};
  const circle=(x,z,r,n=48)=>{for(let i=0;i<n;i++)line([x+Math.cos(i/n*Math.PI*2)*r,z+Math.sin(i/n*Math.PI*2)*r],[x+Math.cos((i+1)/n*Math.PI*2)*r,z+Math.sin((i+1)/n*Math.PI*2)*r]);};
  if(s.name==='东田径场'){
   // The surveyed perimeter determines the stadium footprint; lane striping is schematic.
   this.mesh(flat(s.points,BASE+.065),this.mat('#b87661',{polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1}));
   const fw=w*.64,fd=d*.67;this.mesh(flat(rectangle(cx,cz,fw,fd),BASE+.115),this.mat('#789a65'));
   const r=fw/2+3,straight=Math.max(0,(fd-fw)/2);for(let k=0;k<6;k++){const rr=r+k*1.65;const half=[];for(let i=0;i<=48;i++){const t=i/48*Math.PI;half.push([cx+Math.cos(t)*rr,cz+straight+Math.sin(t)*rr]);}for(let i=1;i<half.length;i++)line(half[i-1],half[i]);const lower=[];for(let i=0;i<=48;i++){const t=Math.PI+i/48*Math.PI;lower.push([cx+Math.cos(t)*rr,cz-straight+Math.sin(t)*rr]);}line(half[half.length-1],lower[0]);for(let i=1;i<lower.length;i++)line(lower[i-1],lower[i]);line(lower[lower.length-1],half[0]);}
   rect(cx,cz,fw*.88,fd*.89);line([cx-fw*.44,cz],[cx+fw*.44,cz]);circle(cx,cz,fw*.11);
   rect(cx,cz-fd*.34,fw*.5,fd*.2);rect(cx,cz+fd*.34,fw*.5,fd*.2);
   for(let j=0;j<4;j++)this.mesh(boxGeometry(cx+w*.45,BASE+1+j*1.1,cz,3.2,1.15,d*.72),this.mat(j%2?'#c0c7b1':'#d3d6c3'));
  }else if(s.sport==='soccer'){
   for(let j=0;j<8;j++)if(j%2===0)this.mesh(flat(rectangle(cx,z0+(j+.5)*d/8,w*.93,d/8),BASE+.115),this.mat('#8da876'));
   rect(cx,cz,w*.9,d*.91);line([cx-w*.45,cz],[cx+w*.45,cz]);circle(cx,cz,Math.min(w,d)*.14);rect(cx,z0+d*.15,w*.5,d*.21);rect(cx,z1-d*.15,w*.5,d*.21);
  }else if(w>10&&d>10){
   const sport=s.sport||'tennis';const unit=sport==='basketball'?15:11;const nx=Math.max(1,Math.floor(w/unit));const nz=Math.max(1,Math.floor(d/(sport==='tennis'?26:28)));
   for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const ux=x0+(i+.5)*w/nx,uz=z0+(j+.5)*d/nz;rect(ux,uz,w/nx*.82,d/nz*.88);line([ux-w/nx*.41,uz],[ux+w/nx*.41,uz]);if(sport==='basketball')circle(ux,uz,Math.min(w/nx,d/nz)*.14,20);else{line([ux-w/nx*.26,uz-d/nz*.44],[ux-w/nx*.26,uz+d/nz*.44]);line([ux+w/nx*.26,uz-d/nz*.44],[ux+w/nx*.26,uz+d/nz*.44]);}}
  }
  if(pos.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));const marks=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:'#ebe8cf',transparent:false,depthTest:true,depthWrite:false}));marks.renderOrder=6;this.scene.add(marks);}
 }
 buildRoads(){const curb=[],roads=[],paths=[],mark=[];for(const r of this.data.roads){const foot=/footway|path|steps|cycleway/.test(r.kind);if(foot){paths.push(ribbon(r.points,r.width,BASE+.115));continue;}curb.push(ribbon(r.points,r.width+2.5,BASE+.075));roads.push(ribbon(r.points,r.width,BASE+.125));
  if(r.width>=6){let offset=0;for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<.1)continue;const dx=(b[0]-a[0])/len,dz=(b[1]-a[1])/len;for(let t=offset;t<len-1;t+=12)mark.push(ribbon([[a[0]+dx*t,a[1]+dz*t],[a[0]+dx*Math.min(t+3,len),a[1]+dz*Math.min(t+3,len)]],.22,BASE+.175));offset=(offset-len)%12;if(offset<0)offset+=12;}}
  }this.merge(curb,this.mat('#dfdeca',{map:this.pavers}));this.merge(roads,this.mat('#9baba3',{map:this.asphalt}));this.merge(paths,this.mat('#d3cdb7',{map:this.pavers}));this.merge(mark,this.mat('#e5dfbd'));
 }
 buildingMat(){const m=this.mat('#f0e9d2',{vertexColors:true,roughness:.82});m.onBeforeCompile=s=>{
   s.uniforms.uCampusNight=this.night;s.uniforms.uSelected=this.selection;s.uniforms.uHovered=this.hover;s.uniforms.uColorMode=this.colorMode;
   s.vertexShader='attribute float buildingIndex; varying vec3 vCampusPos; varying vec3 vCampusNormal; varying float vCampusId;\n'+s.vertexShader;
   s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvCampusPos=(modelMatrix*vec4(transformed,1.0)).xyz;vCampusNormal=normalize(mat3(modelMatrix)*objectNormal);vCampusId=buildingIndex;');
   s.fragmentShader='uniform float uCampusNight; uniform float uSelected; uniform float uHovered; uniform float uColorMode; varying vec3 vCampusPos; varying vec3 vCampusNormal; varying float vCampusId; float campusRand(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}\n'+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    if(abs(vCampusNormal.y)<0.25 && vCampusPos.y>3.0 && uColorMode<0.5){
      float along=abs(vCampusNormal.x)>0.7?vCampusPos.z:vCampusPos.x;
      vec2 cell=fract(vec2(along/4.2,vCampusPos.y/3.5));
      float win=step(.23,cell.x)*step(cell.x,.76)*step(.24,cell.y)*step(cell.y,.77);
      float seed=campusRand(floor(vec2(along/4.2+vCampusId*11.0,vCampusPos.y/3.5)));
      vec3 glass=mix(vec3(.17,.28,.28),vec3(.30,.43,.44),seed);
      diffuseColor.rgb=mix(diffuseColor.rgb,glass,win*.85);
      if(uCampusNight>0.01&&seed>.38)diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.0,.72,.34),win*uCampusNight*.8);
      float floorline=step(.96,cell.y);diffuseColor.rgb*=1.0-floorline*.1;
    }
    float selected=1.0-step(.25,abs(vCampusId-uSelected));
    float hovered=1.0-step(.25,abs(vCampusId-uHovered));
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.48,.70,.35),selected*.22+hovered*.12);
   `);
   s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
    if(abs(vCampusNormal.y)<.25&&vCampusPos.y>3.0&&uColorMode<.5){
      float al=abs(vCampusNormal.x)>.7?vCampusPos.z:vCampusPos.x;
      vec2 ce=fract(vec2(al/4.2,vCampusPos.y/3.5));
      float wi=step(.23,ce.x)*step(ce.x,.76)*step(.24,ce.y)*step(ce.y,.77);
      float se=campusRand(floor(vec2(al/4.2+vCampusId*11.0,vCampusPos.y/3.5)));
      totalEmissiveRadiance+=vec3(1.0,.65,.22)*wi*step(.38,se)*uCampusNight*.55;
    }
   `);
  };m.customProgramCacheKey=()=> 'campus-buildings-1';return m;}
 colorGeometry(g,b,index,wallColor,roofColor){const n=g.attributes.position.count;const color=new Float32Array(n*3),ids=new Float32Array(n);const wall=new THREE.Color(wallColor),roof=new THREE.Color(roofColor);for(let i=0;i<n;i++){const c=g.attributes.normal.getY(i)>.8?roof:wall;c.toArray(color,i*3);ids[i]=index;}g.setAttribute('color',new THREE.BufferAttribute(color,3));g.setAttribute('buildingIndex',new THREE.BufferAttribute(ids,1));return g;}
 buildBuildings(){const gs=[];this.buildingGeometries=[];this.buildingRanges=[];let vertex=0;const random=rng(1896);this.data.buildings.forEach((b,i)=>{
   const base=PALETTE[b.category];const c=new THREE.Color(base).offsetHSL((random()-.5)*.025,0,(random()-.5)*.07);
   const roof=/主楼|图书/.test(b.name)?'#aabfc0':b.category==='living'?'#a17963':b.category==='academic'?'#a6aa96':'#b3b4a0';
   let h=b.height;if(b.osmId===263624481)h=13;
   const geo=extrude(b.points,h,BASE,b.holes);gs.push(this.colorGeometry(geo,b,i,c,roof));
   this.dimensions.set(b.id,{height:b.height,bounds:bounds(b.points)});
   if(b.osmId===263624481){const [x0,z0,x1,z1]=bounds(b.points);const cx=(x0+x1)/2;const south=z1-21;
    for(const [w,d,yh] of [[85,35,7],[68,31,13],[49,28,20],[32,25,26],[17,20,29.75]]){const g=boxGeometry(cx,BASE+13,south,w,yh,d);gs.push(this.colorGeometry(g,b,i,'#b1c9c9','#a7bab6'));}
    const clockg=boxGeometry(cx,BASE+42.75,south,12,7,13);gs.push(this.colorGeometry(clockg,b,i,'#dedac4','#b3bdad'));this.addClock(cx,BASE+46.25,south+6.55,3.4);
    b.displayHeight=49.75;
   }
   if(b.osmId===263624057){const [x0,z0,x1,z1]=bounds(b.points);const cap=boxGeometry((x0+x1)/2,BASE+b.height,(z0+z1)/2,(x1-x0)*.65,4,(z1-z0)*.8);gs.push(this.colorGeometry(cap,b,i,'#bfcbd0','#aebfc0'));b.displayHeight=b.height+4;}
  });
  // One draw call for every campus building; the attribute preserves per-building selection.
  for(const g of gs){this.buildingRanges.push([vertex,vertex+g.attributes.position.count]);vertex+=g.attributes.position.count;}
  this.buildingMesh=this.merge(gs,this.buildingMat(),{cast:true});this.pickables.push(this.buildingMesh);this.originalColors=this.buildingMesh.geometry.attributes.color.array.slice();
  const edge=new THREE.EdgesGeometry(this.buildingMesh.geometry,35);this.buildingEdges=new THREE.LineSegments(edge,new THREE.LineBasicMaterial({color:'#596959',transparent:true,opacity:.16}));this.scene.add(this.buildingEdges);
  const ac=[];for(const b of this.data.buildings){if(b.area<350||/图书|主楼/.test(b.name))continue;const bb=bounds(b.points),x=(bb[0]+bb[2])/2,z=(bb[1]+bb[3])/2;if(pointIn([x,z],b.points))ac.push(boxGeometry(x,BASE+b.height+.15,z,Math.min(5,(bb[2]-bb[0])*.2),1.5,3));}this.merge(ac,this.mat('#c8d0c0'),{cast:true});
 }
 addClock(x,y,z,r){const cv=document.createElement('canvas');cv.width=cv.height=128;const c=cv.getContext('2d');c.fillStyle='#dce2d1';c.beginPath();c.arc(64,64,61,0,Math.PI*2);c.fill();c.strokeStyle='#526555';c.lineWidth=3;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;c.beginPath();c.moveTo(64+Math.sin(a)*48,64-Math.cos(a)*48);c.lineTo(64+Math.sin(a)*55,64-Math.cos(a)*55);c.stroke();}c.lineWidth=5;c.beginPath();c.moveTo(64,31);c.lineTo(64,64);c.lineTo(91,77);c.stroke();const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshBasicMaterial({map:tx,transparent:true});const o=this.mesh(new THREE.PlaneGeometry(r*2,r*2),m,{receive:false});o.position.set(x,y,z);}
 buildLandmarks(){
  const plaza=this.data.interpretive.find(p=>p.id==='interpretive/four-inventions');
  if(plaza&&!this.blocked(plaza.position,3)){
   this.fourInventionsMarker=createFourInventionsMarker(plaza.position);
   this.scene.add(this.fourInventionsMarker);
  }
  const stone=this.mat('#e6ddc4'),white=this.mat('#ece6d3'),gold=this.mat('#af9163',{metalness:.45,roughness:.4});this.landmarkGroup=new THREE.Group();this.scene.add(this.landmarkGroup);
  const tower=this.data.landmarks.find(p=>p.name==='腾飞塔');if(tower){const [x,z]=tower.position;for(let i=0;i<4;i++)this.mesh(boxGeometry(x,BASE+i*.7,z,18-i*3,.7,14-i*2),stone,{parent:this.landmarkGroup});
   for(let i=0;i<3;i++){const g=new THREE.ConeGeometry(i===0?2.9:2.2,i===0?29:23,3);g.translate(x+(i-1)*2.8,BASE+3+(i===0?14.5:11.5),z);const o=this.mesh(g,white,{cast:true,parent:this.landmarkGroup});o.userData.place=tower;this.pickables.push(o);}
   const s=this.mesh(new THREE.TorusGeometry(3.6,.65,6,24,Math.PI*1.55),gold,{cast:true,parent:this.landmarkGroup});s.position.set(x,BASE+29,z);s.rotation.z=-.9;s.rotation.x=.2;s.userData.place=tower;this.pickables.push(s);
  }
  const gate=this.data.landmarks.find(p=>p.name==='北门');if(gate){this.northGate=createNorthGate(gate.position,BASE);this.landmarkGroup.add(this.northGate);for(const m of this.northGate.children){if(m.name==='outer entry pier'||m.name==='sweeping white gate roof'){m.userData.place=gate;this.pickables.push(m);}}}
  const lib=this.data.buildings.find(b=>b.osmId===263624481);if(lib){const bb=bounds(lib.points);this.libraryFacade=createLibraryFacade({centerX:(bb[0]+bb[2])/2,stairFrontZ:bb[3],steppedCenterZ:bb[3]-21,baseY:BASE});this.scene.add(this.libraryFacade);this.textSign('钱 学 森 图 书 馆',(bb[0]+bb[2])/2,BASE+15,bb[3]-2.8,33,3.1);}
  const mainE=this.data.buildings.find(b=>b.osmId===263624057);if(mainE){this.mainTowerFacade=createMainTowerFacade({footprint:bounds(mainE.points),height:mainE.height,baseY:BASE});this.scene.add(this.mainTowerFacade);}
   const central=this.data.buildings.find(b=>b.osmId===263625088);if(central){const bb=bounds(central.points);this.mesh(boxGeometry((bb[0]+bb[2])/2,BASE+central.height,(bb[1]+bb[3])/2,28,1.3,18),this.mat('#b6c1aa'),{cast:true});}
 }
 textSign(text,x,y,z,w,h){const cv=document.createElement('canvas');cv.width=1024;cv.height=128;const c=cv.getContext('2d');c.fillStyle='#637465';c.fillRect(0,0,1024,128);c.fillStyle='#f3ecd2';c.font='60px "Microsoft YaHei",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,512,65);const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;const o=this.mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tx}),{receive:false});o.position.set(x,y,z);}
 blocked(p,margin=0){for(let i=0;i<this.data.buildings.length;i++){const b=this.footprintBounds[i];if(p[0]<b[0]-margin||p[0]>b[2]+margin||p[1]<b[1]-margin||p[1]>b[3]+margin)continue;const poly=this.data.buildings[i].points;if(pointIn(p,poly)&&!this.data.buildings[i].holes.some(h=>pointIn(p,h)))return true;if(margin>0)for(let j=1;j<poly.length;j++)if(pointSegment(p,poly[j-1],poly[j]).distance<margin)return true;}return false;}
 roadDistance(p){let distance=Infinity;for(const r of this.data.roads)for(let i=1;i<r.points.length;i++){const d=pointSegment(p,r.points[i-1],r.points[i]).distance-r.width/2;if(d<distance)distance=d;}return distance;}
 buildTrees(){
   const random=rng(1956),trees=[],waters=this.data.surfaces.filter(s=>s.kind==='water');
   const lib=this.data.buildings.find(b=>b.osmId===263624481);
   const bb=lib?bounds(lib.points):null;
   const entranceAxis=p=>bb&&Math.abs(p[0]-(bb[0]+bb[2])/2)<15&&p[1]>=bb[3]-3&&p[1]<=bb[3]+115;

   const canPlant=p=>!this.blocked(p,2)&&!waters.some(s=>pointIn(p,s.points))&&!entranceAxis(p);const used=new Set();const add=(x,z,type=0)=>{const key=Math.round(x/5)+','+Math.round(z/5);if(used.has(key))return;used.add(key);trees.push({x,z,h:7+random()*5,r:3.1+random()*2.2,c:random(),type});};
  for(const s of this.data.surfaces.filter(s=>s.kind==='wood'||s.kind==='green')){const [x0,z0,x1,z1]=bounds(s.points);const spacing=s.kind==='wood'?11:15;for(let x=x0+4;x<x1;x+=spacing)for(let z=z0+4;z<z1;z+=spacing){const p=[x+(random()-.5)*7,z+(random()-.5)*7];if(pointIn(p,s.points)&&canPlant(p)&&this.roadDistance(p)>1.5&&random()>.08)add(...p,s.kind==='wood'&&random()>.74?1:0);}}
  for(const r of this.data.roads.filter(r=>r.campus&&!/steps|path|footway|cycleway/.test(r.kind))){for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<14)continue;const dx=(b[0]-a[0])/len,dz=(b[1]-a[1])/len;for(let t=7;t<len-3;t+=16)for(const side of [-1,1]){const p=[a[0]+dx*t-dz*(r.width/2+4)*side,a[1]+dz*t+dx*(r.width/2+4)*side];if(this.data.boundary.some(b=>pointIn(p,b))&&canPlant(p)&&this.roadDistance(p)>2.2)add(...p,0);}}}
  this.treePositions=trees;this.treeCells=new Map();for(const t of trees){const key=Math.floor(t.x/12)+','+Math.floor(t.z/12);if(!this.treeCells.has(key))this.treeCells.set(key,[]);this.treeCells.get(key).push(t);}this.trees=new THREE.Group();this.scene.add(this.trees);this.treeCount=trees.length;this.canopyTexture=makeCanopyTexture();const n=trees.length;const dummy=new THREE.Object3D();const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.4,.65,1,5),this.mat('#887763'),n);const crown=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,this.isMobile?1:2),this.mat('#e0ead8',{roughness:.98,map:this.canopyTexture}),n);const crown2=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),this.mat('#ecf1e7',{roughness:.98,map:this.canopyTexture}),n);const crown3=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,this.isMobile?0:1),this.mat('#e0e9d8',{roughness:.98,map:this.canopyTexture}),n);const colors=['#64834c','#799458','#5b7948','#899f66','#729159'];trees.forEach((t,i)=>{dummy.position.set(t.x,BASE+t.h*.35,t.z);dummy.scale.set(1,t.h*.7,1);dummy.rotation.set(0,0,0);dummy.updateMatrix();trunk.setMatrixAt(i,dummy.matrix);dummy.position.y=BASE+t.h*.77;dummy.scale.set(t.type?t.r*.55:t.r,t.type?t.h*.68:t.h*.42,t.type?t.r*.55:t.r*.9);dummy.rotation.set(t.c*.3,t.c*6,.12*t.c);dummy.updateMatrix();crown.setMatrixAt(i,dummy.matrix);crown.setColorAt(i,new THREE.Color(colors[Math.floor(t.c*colors.length)]));dummy.position.x+=t.r*.5;dummy.position.y+=t.r*.1;dummy.scale.multiplyScalar(.74);dummy.updateMatrix();crown2.setMatrixAt(i,dummy.matrix);crown2.setColorAt(i,new THREE.Color(colors[(Math.floor(t.c*colors.length)+1)%colors.length]));dummy.position.set(t.x-t.r*.37,BASE+t.h*.79,t.z+t.r*.27);dummy.scale.set(t.r*.67,t.h*.31,t.r*.72);dummy.rotation.set(-t.c*.13,t.c*5.2,t.c*.16);dummy.updateMatrix();crown3.setMatrixAt(i,dummy.matrix);crown3.setColorAt(i,new THREE.Color(colors[(Math.floor(t.c*colors.length)+3)%colors.length]));});for(const m of [trunk,crown,crown2,crown3]){m.castShadow=true;m.receiveShadow=true;m.instanceMatrix.needsUpdate=true;this.trees.add(m);}this.treeCrowns=[crown,crown2,crown3];
   // Narrow evergreen forms add believable species diversity to planted groves.
   const conifers=trees.filter(t=>t.type===1);
   if(conifers.length){
    const pines=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,8),this.mat('#d9e6d2',{roughness:.99,map:this.canopyTexture}),conifers.length);
    const arbor=new THREE.Object3D();
    conifers.forEach((t,i)=>{arbor.position.set(t.x,BASE+t.h*.61,t.z);arbor.scale.set(t.r*.67,t.h*.84,t.r*.67);arbor.rotation.set(0,t.c*6.28,0);arbor.updateMatrix();pines.setMatrixAt(i,arbor.matrix);pines.setColorAt(i,new THREE.Color(['#557450','#4b6549','#64805b'][i%3]));});
    pines.instanceMatrix.needsUpdate=true;pines.castShadow=!this.isMobile;pines.receiveShadow=true;this.trees.add(pines);
   }
 }
 buildFurniture(){const lamps=[],benches=[];let k=0;for(const r of this.data.roads.filter(r=>r.campus&&r.width>=6)){for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);const dx=(b[0]-a[0])/(len||1),dz=(b[1]-a[1])/(len||1);for(let t=17;t<len;t+=48){const x=a[0]+dx*t-dz*(r.width/2+1.6),z=a[1]+dz*t+dx*(r.width/2+1.6);if(this.blocked([x,z]))continue;lamps.push({x,z});if(k++%3===0)benches.push(boxGeometry(x-dz*2,BASE+.6,z+dx*2,2.8,.35,.8));}}}this.merge(benches,this.mat('#967b5c'),{cast:true});
  const pole=new THREE.InstancedMesh(new THREE.CylinderGeometry(.1,.16,5.5,5),this.mat('#67786a'),lamps.length);this.lampMaterial=new THREE.MeshStandardMaterial({color:'#f4e5b1',emissive:'#ffd68a',emissiveIntensity:0,roughness:.45});const lamp=new THREE.InstancedMesh(new THREE.SphereGeometry(.55,6,4),this.lampMaterial,lamps.length);const dummy=new THREE.Object3D();lamps.forEach((p,i)=>{dummy.position.set(p.x,BASE+2.75,p.z);dummy.updateMatrix();pole.setMatrixAt(i,dummy.matrix);dummy.position.y=BASE+5.7;dummy.updateMatrix();lamp.setMatrixAt(i,dummy.matrix);});this.scene.add(pole,lamp);
 }
 buildLabels(){const priority=[263624481,263624057,263625088,1167525875,263632364,264106085,263625679,263624056,263808678,263808685];const named=this.data.buildings.filter(b=>b.name!=='未命名建筑');const ordered=named.slice().sort((a,b)=>(priority.indexOf(a.osmId)<0?999:priority.indexOf(a.osmId))-(priority.indexOf(b.osmId)<0?999:priority.indexOf(b.osmId)));const otherGates=this.data.pois.filter(p=>/门$/.test(p.name)&&p.name!=='西安交通大学北门').map(p=>({...p,category:'culture',categoryName:'校园入口',description:'入口位置来源于 OSM；建筑外观尚待校方照片验证。'}));const places=[...this.data.landmarks,...otherGates,...ordered,...this.data.interpretive];for(const p of places){const el=document.createElement('button');el.className='label';el.setAttribute('aria-label','查看'+p.name);const dot=document.createElement('i');const span=document.createElement('span');span.textContent=p.name.replace('西安交通大学','').replace('南洋书院 ','南洋 · ').replace('仲英书院 ','仲英 · ');el.append(dot,span);el.addEventListener('pointerdown',e=>e.stopPropagation());el.addEventListener('click',()=>this.onSelect(p));document.querySelector('#labels').appendChild(el);const i=this.data.buildings.indexOf(p);this.labelItems.push({place:p,el,index:i,priority:places.indexOf(p),pos:new THREE.Vector3((p.center||p.position)[0],(p.displayHeight||p.height||7)+BASE+4,(p.center||p.position)[1])});}
 }
 bind(){const cv=this.renderer.domElement;let down=null,dragging=false;cv.addEventListener('pointerdown',e=>{this.cancelFlight();if(this.tour)this.endTour();down={x:e.clientX,y:e.clientY};dragging=false;if(this.mode==='walk')cv.setPointerCapture(e.pointerId);});cv.addEventListener('pointermove',e=>{
   if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)dragging=true;
   if(this.mode==='walk'&&down){this.walkYaw-=(e.movementX||e.clientX-down.x)*.0035;this.walkPitch=Math.max(-1.25,Math.min(1.25,this.walkPitch-(e.movementY||e.clientY-down.y)*.0035));down={x:e.clientX,y:e.clientY};this.applyWalkLook();return;}
   if(this.mode==='orbit'&&!down&&e.pointerType==='mouse'){this.pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hit=this.ray.intersectObjects(this.pickables,false)[0];const tooltip=document.querySelector('#tooltip');if(hit){const p=this.hitPlace(hit);this.hover.value=p?.index??-1;cv.style.cursor='pointer';tooltip.textContent=p?.place.name||'';tooltip.hidden=false;tooltip.style.left=Math.min(innerWidth-240,e.clientX+15)+'px';tooltip.style.top=(e.clientY+16)+'px';}else{this.hover.value=-1;cv.style.cursor='grab';tooltip.hidden=true;}}
  });cv.addEventListener('pointerup',e=>{if(down&&!dragging&&this.mode==='orbit'){this.pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);this.ray.setFromCamera(this.pointer,this.camera);const h=this.ray.intersectObjects(this.pickables,false)[0];if(h)this.onSelect(this.hitPlace(h).place);}down=null;dragging=false;});cv.addEventListener('pointercancel',()=>{down=null;dragging=false;});cv.addEventListener('pointerleave',()=>{this.hover.value=-1;document.querySelector('#tooltip').hidden=true;});cv.addEventListener('wheel',()=>{this.cancelFlight();this.endTour();},{passive:true});
  addEventListener('resize',()=>this.resize());addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.code==='Escape'){if(this.mode==='walk')this.exitWalk();else this.endTour();}if(this.mode==='walk'&&/Key[WASD]|Arrow|Shift/.test(e.code)){e.preventDefault();this.keys.add(e.code);}});addEventListener('keyup',e=>this.keys.delete(e.code));addEventListener('blur',()=>this.keys.clear());
  cv.addEventListener('webglcontextlost',e=>{e.preventDefault();this.contextLost=true;this.notify('图形上下文已暂停。请重新加载页面恢复画面。');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.keys.clear();});
 }
 hitPlace(hit){if(hit.object===this.buildingMesh){const i=Math.round(this.buildingMesh.geometry.attributes.buildingIndex.getX(hit.face.a));return{place:this.data.buildings[i],index:i};}return{place:hit.object.userData.place,index:-1};}
 resize(){const w=Math.max(1,document.documentElement.clientWidth),h=Math.max(1,window.innerHeight);this.width=w;this.height=h;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);this.isMobile=w<=768;}
 cancelFlight(){if(this.flight){this.flight=null;this.controls.enabled=this.mode!=='walk';}this.controls.autoRotate=this.auto;}
 fly(position,target,duration=1500){if(this.mode==='walk')this.exitWalk();this.flight={start:performance.now(),duration:this.reduced?0:duration,from:this.camera.position.clone(),to:new THREE.Vector3(...position),targetFrom:this.controls.target.clone(),targetTo:new THREE.Vector3(...target)};this.controls.enabled=false;}
 home(animate=true){this.endTour();if(this.mode==='walk')this.exitWalk();this.setAuto(false);const mobile=innerWidth<=768;const target=mobile?[-25,0,-50]:[25,0,-50];const position=mobile?[790,1370,1390]:[930,1000,1190];if(animate)this.fly(position,target);else{this.camera.position.set(...position);this.controls.target.set(...target);this.controls.update();}this.onMode('home');}
 top(){this.endTour();this.setAuto(false);const mobile=innerWidth<=768;this.fly([mobile?-30:30,1450,-49],[mobile?-30:30,0,-50]);this.onMode('top');}
 north(){if(this.mode==='walk')return;const t=this.controls.target,d=this.camera.position.distanceTo(t),polar=this.controls.getPolarAngle();this.fly([t.x,t.y+Math.cos(polar)*d,t.z+Math.sin(polar)*d],[t.x,t.y,t.z]);}
 zoom(factor){if(this.mode==='walk')return;const offset=this.camera.position.clone().sub(this.controls.target).multiplyScalar(factor);const d=offset.length();offset.setLength(Math.max(35,Math.min(2450,d)));this.fly(this.controls.target.clone().add(offset).toArray(),this.controls.target.toArray(),400);}
 setAuto(value){if(this.mode==='walk')this.exitWalk();this.auto=value;this.controls.autoRotate=value&&!this.reduced;const btn=document.querySelector('#orbit-btn');btn.classList.toggle('active',value);btn.setAttribute('aria-pressed',String(value));if(value&&this.reduced)this.notify('系统已开启减弱动态效果，自动环绕保持静止。');return value;}
 focus(p,fly=true){const i=this.data.buildings.indexOf(p);this.selected=i;this.selectedPlace=p;this.selection.value=i;this.labelItems.forEach(l=>l.el.classList.toggle('selected',l.place.id===p.id));const c=p.center||p.position,h=p.displayHeight||p.height||18;const dim=p.points?bounds(p.points):null;const size=dim?Math.max(dim[2]-dim[0],dim[3]-dim[1]):35;const dist=Math.max(120,size*1.6,h*2.2);this.setAuto(false);if(fly)this.fly([c[0]+dist*.8,c[1]===undefined?dist:Math.max(h+dist*.65,80),c[1]+dist*1.1],[c[0],h*.25,c[1]],1400);}
 clearSelection(){this.selection.value=-1;this.selected=-1;this.selectedPlace=null;this.labelItems.forEach(l=>l.el.classList.remove('selected'));}
 setColors(mode){this.colorMode.value=mode==='natural'?0:1;const attr=this.buildingMesh.geometry.attributes.color,ids=this.buildingMesh.geometry.attributes.buildingIndex;if(mode==='natural')attr.array.set(this.originalColors);else for(let i=0;i<attr.count;i++){const b=this.data.buildings[Math.round(ids.getX(i))];const c=new THREE.Color(mode==='category'?CATEGORY[b.category]:b.heightSource==='official-document-height'?'#6297b9':b.levels?'#79b7a1':'#cda779');if(this.buildingMesh.geometry.attributes.normal.getY(i)>.8)c.multiplyScalar(.85);c.toArray(attr.array,i*3);}attr.needsUpdate=true;}
 lighting(mode){this.lightMode=mode;const night=mode==='night',dusk=mode==='dusk';this.night.value=night?1:dusk?.3:0;this.scene.background.set(SKY[mode]);this.scene.fog.color.set(SKY[mode]);this.scene.fog.near=night?1400:1800;this.ground.material.color.set(night?'#425454':dusk?'#b8b7a2':'#b7c6b4');this.hemi.intensity=night?.75:dusk?1.4:1.75;this.hemi.color.set(night?'#a4c7dc':dusk?'#c4c7d7':'#e4f0ec');this.sun.intensity=night?.4:dusk?2.0:2.6;this.sun.color.set(night?'#9cbed7':dusk?'#ffc79c':'#fff0cf');this.sun.position.set(dusk?-900:-650,dusk?350:1000,450);this.fill.intensity=night?.25:.6;this.lampMaterial.emissiveIntensity=night?2:dusk?.7:0;this.renderer.toneMappingExposure=night?1.0:1.06;this.sky.visible=!night&&!this.isMobile;this.sky.material.uniforms.sunPosition.value.copy(this.sun.position);this.sky.material.uniforms.rayleigh.value=dusk?1.8:.85;this.sky.material.uniforms.turbidity.value=dusk?7:3;document.body.classList.toggle('night',night);}
 quality(mode){this.renderer.shadowMap.enabled=mode==='high';this.renderer.setPixelRatio(mode==='low'?Math.min(devicePixelRatio,1):Math.min(devicePixelRatio,this.isMobile?1.5:1.8));this.renderer.setSize(innerWidth,innerHeight);this.buildingMesh.material.needsUpdate=true;}
 nearestRoad(p){let best={distance:Infinity,point:p};for(const r of this.data.roads.filter(r=>r.campus))for(let i=1;i<r.points.length;i++){const q=pointSegment(p,r.points[i-1],r.points[i]);if(q.distance<best.distance&&this.data.boundary.some(b=>pointIn(q.point,b))&&!this.blocked(q.point,1.5)&&!this.data.surfaces.some(s=>s.kind==='water'&&pointIn(q.point,s.points)))best=q;}return best.point;}
 treeGap([x,z]){
  const cx=Math.floor(x/12),cz=Math.floor(z/12);let best=20;
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
   for(const t of this.treeCells?.get((cx+dx)+','+(cz+dz))||[]){
    best=Math.min(best,Math.hypot(t.x-x,t.z-z));
   }
  }
  return best;
 }
 isWalkable(point,margin=.75){
  if(!this.data.boundary.some(b=>pointIn(point,b))||this.blocked(point,margin))return false;
  if(this.data.surfaces.some(s=>s.kind==='water'&&pointIn(point,s.points)))return false;
    return this.treeGap(point)>=margin+.55;
 }
 chooseWalkStart(p){
   const source=p?.center||p?.position||[-31,-520];
   const facade=p?.points&&!p.surface&&p.height?bounds(p.points):null;
   const trials=facade?(()=>{
     const [x0,z0,x1,z1]=facade,cx=(x0+x1)/2,cz=(z0+z1)/2;
     return [
       {desired:[cx,z1+56],target:[cx,z1-4],direction:'south'},
       {desired:[cx,z0-56],target:[cx,z0+4],direction:'north'},
       {desired:[x1+52,cz],target:[x1-4,cz],direction:'east'},
       {desired:[x0-52,cz],target:[x0+4,cz],direction:'west'}
     ];
   })():[{desired:source,target:p?source:null,direction:'nearby'}];
   const water=this.data.surfaces.filter(s=>s.kind==='water');
   const choices=[];
   for(const trial of trials){
     const result=findSafeWalkStart({
       ...trial,roads:this.data.roads,boundaries:this.data.boundary,
       buildings:this.data.buildings,water,trees:this.treePositions||[],
       obstacles:[],
       canBlock:(q,margin)=>this.blocked(q,margin)
     });
     if(result)choices.push({...result,...trial});
     // Prefer the authentic photographed south facade when its view is clear.
     if(p?.osmId===263624481 && result && !result.fallback)break;
   }
   choices.sort((a,b)=>(a.fallback?1000:0)+a.cost-(b.fallback?1000:0)-b.cost);
   const result=choices[0];
   if(!result)return null;
   this.walkSpawn={start:[...result.p],desired:result.desired,target:result.target,kind:result.type,direction:result.direction,fallback:result.fallback};
   return result.p;
  }
 enterWalk(p=null){
  this.endTour();this.cancelFlight();this.setAuto(false);this.mode='walk';
  this.controls.enabled=false;this.controls.stopListenToKeyEvents();
  const start=this.chooseWalkStart(p);
  if(!start){this.mode='orbit';this.controls.enabled=true;this.controls.listenToKeyEvents(window);this.notify('附近没有安全的地面入口，试试其他建筑。');return false;}
  this.walkStart=[...start];
  this.camera.fov=62;this.camera.near=.2;this.camera.updateProjectionMatrix();
  this.camera.position.set(start[0],BASE+2,start[1]);
  const look=this.walkSpawn?.target||(p?(p.center||p.position):[start[0],start[1]+50]);
  this.walkYaw=p?Math.atan2(start[0]-look[0],start[1]-look[1]):Math.PI;
  this.walkPitch=p?Math.atan2((p.displayHeight||p.height||8)*.32-2,Math.max(20,Math.hypot(start[0]-look[0],start[1]-look[1]))):0;
  this.applyWalkLook();this.keys.clear();this.onMode('walk');
 }
 applyWalkLook(){this.camera.rotation.order='YXZ';this.camera.rotation.set(this.walkPitch,this.walkYaw,0);}
 exitWalk(){if(this.mode!=='walk')return;this.mode='orbit';this.camera.fov=39;this.camera.near=.6;this.camera.updateProjectionMatrix();this.controls.enabled=true;this.controls.listenToKeyEvents(window);const forward=new THREE.Vector3();this.camera.getWorldDirection(forward);const target=this.camera.position.clone().add(forward.multiplyScalar(80));target.y=0;this.controls.target.copy(target);this.camera.position.y=Math.max(this.camera.position.y,80);this.controls.update();this.keys.clear();this.onMode('orbit');}
 moveWalk(dt){let f=0,s=0;if(this.keys.has('KeyW')||this.keys.has('ArrowUp'))f++;if(this.keys.has('KeyS')||this.keys.has('ArrowDown'))f--;if(this.keys.has('KeyD')||this.keys.has('ArrowRight'))s++;if(this.keys.has('KeyA')||this.keys.has('ArrowLeft'))s--;if(!f&&!s)return;const norm=Math.hypot(f,s);f/=norm;s/=norm;const step=(this.keys.has('ShiftLeft')||this.keys.has('ShiftRight')?12:5)*Math.min(dt,.06);const dx=(-Math.sin(this.walkYaw)*f+Math.cos(this.walkYaw)*s)*step;const dz=(-Math.cos(this.walkYaw)*f-Math.sin(this.walkYaw)*s)*step;const p=this.camera.position;const valid=(x,z)=>this.isWalkable([x,z],.65);if(valid(p.x+dx,p.z))p.x+=dx;if(valid(p.x,p.z+dz))p.z+=dz;p.y=BASE+2;}
 startTour(stops){this.exitWalk();this.setAuto(false);this.tour={stops,index:-1,paused:false,next:0};this.nextTour();}
 nextTour(){if(!this.tour)return;const t=this.tour;t.index=(t.index+1)%t.stops.length;const p=t.stops[t.index];this.focus(p);this.onSelect(p,false);t.next=performance.now()+8000;this.onTour?.(t);}
 endTour(){if(this.tour){this.tour=null;this.onTour?.(null);}}
 updateLabels(){const used=[];const dist=this.camera.position.distanceTo(this.controls.target);for(const item of this.labelItems){const selected=item.place.id===this.selectedPlace?.id;let visible=this.labelsEnabled&&this.mode!=='walk'&&(selected||item.priority<11||dist<600&&item.priority<45||dist<320);if(visible){const v=this.proj.copy(item.pos).project(this.camera);const x=(v.x+1)/2*this.width,y=(1-v.y)/2*this.height;const w=Math.min(180,item.place.name.length*10+22);visible=v.z<1&&v.z>-1&&x>w/2+6&&x<this.width-w/2-8&&y>99&&y<this.height-105;if(visible&&!selected){if(this.width>768&&x<327)visible=false;if(this.width>768&&x>this.width-220&&y>this.height-315)visible=false;if(used.some(r=>Math.abs(r.x-x)<(r.w+w)/2+13&&Math.abs(r.y-y)<35)){item.overlapFrames=(item.overlapFrames||0)+1;if(item.overlapFrames>10)visible=false;}else item.overlapFrames=0;}if(visible){const smooth=item.screen&&Math.hypot(x-item.screen.x,y-item.screen.y)<170;const sx=smooth?item.screen.x*.46+x*.54:x,sy=smooth?item.screen.y*.46+y*.54:y;item.screen={x:sx,y:sy};item.el.style.left=Math.round(sx)+'px';item.el.style.top=Math.round(sy)+'px';used.push({x:sx,y:sy,w});}}item.el.hidden=!visible;}}
 drawMinimap(){const canvas=document.querySelector('#minimap');if(!canvas||innerWidth<=768)return;const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;const scale=Math.min((w-18)/1210,(h-15)/1180);const ox=132,oz=150;const cv=p=>[p[0]*scale+ox,p[1]*scale+oz];this.miniTransform={scale,ox,oz};c.clearRect(0,0,w,h);const poly=(ps,color,stroke)=>{c.beginPath();ps.forEach((p,i)=>{const [x,y]=cv(p);i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();if(color){c.fillStyle=color;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}};for(const p of this.data.boundary)poly(p,'#e0e6d4','#839a72');for(const s of this.data.surfaces)poly(s.points,s.kind==='water'?'#9bbdb2':s.kind==='pitch'?'#a1b783':'#b8caa3');for(const r of this.data.roads.filter(r=>r.campus)){c.beginPath();r.points.forEach((p,i)=>{const q=cv(p);i?c.lineTo(...q):c.moveTo(...q);});c.strokeStyle='#f2efdf';c.lineWidth=Math.max(1,r.width*scale);c.stroke();}for(const b of this.data.buildings)poly(b.points,b.id===this.selectedPlace?.id?'#65875a':'#b1b89e');const cp=cv([this.controls.target.x,this.controls.target.z]);c.strokeStyle='#6d8c56';c.lineWidth=1.3;c.beginPath();c.arc(...cp,13,0,Math.PI*2);c.stroke();c.fillStyle='#507842';c.beginPath();c.arc(...cp,3,0,Math.PI*2);c.fill();const cam=cv([this.camera.position.x,this.camera.position.z]);c.strokeStyle='#557c4855';c.beginPath();c.moveTo(...cp);c.lineTo(...cam);c.stroke();}
 animate(){requestAnimationFrame(()=>this.animate());if(document.hidden||this.contextLost)return;this.timer.update();const rawDt=this.timer.getDelta(),dt=Math.min(rawDt,.1),now=performance.now();this.frames++;if(rawDt>0){this.frameTimes.push(rawDt);if(this.frameTimes.length>120)this.frameTimes.shift();this.fps=this.frameTimes.length/this.frameTimes.reduce((a,b)=>a+b,0);}if(this.mode==='walk')this.moveWalk(dt);else if(this.flight){const f=this.flight,t=f.duration===0?1:Math.min((now-f.start)/f.duration,1),e=t*t*(3-2*t);this.camera.position.lerpVectors(f.from,f.to,e);this.controls.target.lerpVectors(f.targetFrom,f.targetTo,e);this.camera.lookAt(this.controls.target);if(t===1){this.flight=null;this.controls.enabled=true;this.controls.update();}}else this.controls.update(dt);
  if(this.tour&&!this.tour.paused&&now>this.tour.next)this.nextTour();
  this.renderer.render(this.scene,this.camera);this.updateLabels();if(this.frames%10===0){this.drawMinimap();const needle=document.querySelector('#compass-needle');needle.style.transform=`rotate(${-this.controls.getAzimuthalAngle()*180/Math.PI}deg)`;document.querySelector('#view-height').textContent=this.mode==='walk'?'地面 · 2 m':`视点 ${Math.round(this.camera.position.y)} m`;}if(this.frames%60===0)this.container.dataset.runtime=JSON.stringify(this.diagnostics());
 }
 diagnostics(){return{buildings:this.data.buildings.length,roads:this.data.roads.length,surfaces:this.data.surfaces.length,trees:this.treeCount,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures,fps:Math.round(this.fps),sceneLoadMs:Math.round(this.loadMs),mode:this.mode,walkStart:this.walkStart||null,light:this.lightMode,selected:this.selectedPlace?.name||null,webgl:'WebGL 2',camera:this.camera.position.toArray(),target:this.controls.target.toArray(),contextLost:!!this.contextLost,walkSpawn:this.walkSpawn||null,visibleLabels:this.labelItems.filter(l=>!l.el.hidden).length,reducedMotion:this.reduced,finiteGeometry:[...this.buildingMesh.geometry.attributes.position.array].every(Number.isFinite)};}
}
