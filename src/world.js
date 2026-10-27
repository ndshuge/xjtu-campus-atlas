import * as THREE from 'three';
import {createLibraryAsset} from './library-asset.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {renderPixelRatio,keepOrbitAboveGround,framePercentiles,enableFarFoliageCoverage} from './mobile-render-stability.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createLibraryForecourt} from './library-forecourt.js';
import {createMainComplexAsset,MAIN_IDS,mainDisplayHeight} from './main-complex-asset.js';
import {createBuildingSilhouettes} from './building-silhouettes.js';
import {createTengfeiTower,createSiyuanStele} from './axis-monuments.js';
import {buildingGroupFrame,libraryEntranceFrame} from './building-views.js';
import {createSiyuanCenter,createScienceHall} from './cultural-facades.js';
import {makeGroundPattern} from './ground-pattern.js';
import {createCampusVegetation,fitTreeToBuildings} from './campus-vegetation.js';
import {createSurfaceTexture} from './surface-textures.js';
import {addAvenuePaving} from './avenue-paving.js';
import {findSafeWalkStart} from './walk-placement.js';
import {createFourInventionsMarker} from './four-inventions.js';
import {buildFourInventionsPaving} from './plaza-terrain.js';
import {createNorthGate} from './north-gate.js';
import {createCampusPerimeter,perimeterBlocksPosition} from './campus-perimeter.js';
import {createSecondaryGate} from './secondary-gates.js';
import {createSouthGate} from './south-gate.js';
import {getCampusGateEntries,visualGatePosition} from './gate-entries.js';
import {Sky} from 'three/addons/objects/Sky.js';
import {BASE,shape,flat,extrude,pointIn,pointSegment,bounds,ribbon,rng,boxGeometry,rectangle} from './geo.js';

const PALETTE={academic:'#e3d9bd',living:'#d9bca1',culture:'#e7e2ce',sports:'#d9d7ba',service:'#d1c7a7'};
const CATEGORY={academic:'#96bfc1',living:'#dfb391',culture:'#dbc080',sports:'#9ab483',service:'#c9a5ba'};
const SKY={day:'#d8e4de',dusk:'#c6bdba',night:'#1b303b'};

export class CampusWorld{
 constructor(container,data,{select,notify,changeMode,ready}){
  this.data=data;this.onSelect=select;this.notify=notify;this.onMode=changeMode;this.container=container;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.isMobile=matchMedia('(max-width: 768px)').matches;this.qualityMode=this.isMobile?'low':'high';this.touchDevice=matchMedia('(pointer: coarse)').matches||navigator.maxTouchPoints>0;this.keys=new Set();this.mode='orbit';this.walkTransition=null;this.auto=false;this.tour=null;this.selected=-1;this.hovered=-1;this.lightMode='day';this.night={value:0};this.selection={value:-1};this.hover={value:-1};this.time={value:0};this.colorMode={value:0};this.labelsEnabled=true;this.frames=0;this.fps=0;this.frameTimes=[];this.startTime=performance.now();this.geos=[];this.labelItems=[];this.pickables=[];
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(SKY.day);this.scene.fog=new THREE.Fog(SKY.day,1800,4100);
  try{this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:this.isMobile?'default':'high-performance',preserveDrawingBuffer:!this.isMobile,alpha:false});}catch(e){throw Error('WebGL 2 unavailable: '+e.message);}
  this.renderer.setPixelRatio(renderPixelRatio({width:innerWidth,height:innerHeight,deviceRatio:devicePixelRatio,quality:this.qualityMode}));this.renderer.setSize(innerWidth,innerHeight);this.renderer.shadowMap.enabled=!this.isMobile;this.renderer.shadowMap.type=THREE.PCFShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.06;this.renderer.outputColorSpace=THREE.SRGBColorSpace;container.appendChild(this.renderer.domElement);
  this.camera=new THREE.PerspectiveCamera(39,innerWidth/innerHeight,1.5,4800);this.camera.position.set(950,1040,1270);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(30,0,-55);this.controls.enableDamping=true;this.controls.dampingFactor=.075;this.controls.minDistance=35;this.controls.maxDistance=2450;this.controls.maxPolarAngle=Math.PI*.485;this.controls.minPolarAngle=.06;this.controls.zoomSpeed=.65;this.controls.touches=(this.touchDevice||this.isMobile)?{ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_ROTATE}:{ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};this.controls.panSpeed=this.touchDevice?1.12:.7;this.controls.rotateSpeed=this.touchDevice?.48:1;this.controls.zoomSpeed=this.touchDevice?.76:.65;this.controls.zoomToCursor=true;this.controls.autoRotateSpeed=.35;this.controls.screenSpacePanning=false;this.controls.listenToKeyEvents(window);
  this.hemi=new THREE.HemisphereLight('#e4f0ec','#777e60',1.75);this.scene.add(this.hemi);
  this.sun=new THREE.DirectionalLight('#fff0cf',2.6);this.sun.position.set(-650,1000,450);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-760,right:850,top:830,bottom:-730,near:10,far:2700});this.sun.shadow.bias=-.00016;this.sun.shadow.normalBias=.55;this.scene.add(this.sun);
  this.fill=new THREE.DirectionalLight('#c5dfe6',.6);this.fill.position.set(600,300,-700);this.scene.add(this.fill);
  this.sky=new Sky();this.sky.scale.setScalar(4600);this.sky.material.depthWrite=false;this.sky.visible=!this.isMobile;this.scene.add(this.sky);
  const skyUniforms=this.sky.material.uniforms;skyUniforms.turbidity.value=3;skyUniforms.rayleigh.value=.85;skyUniforms.mieCoefficient.value=.003;skyUniforms.mieDirectionalG.value=.78;skyUniforms.sunPosition.value.copy(this.sun.position);
  this.pavers=createSurfaceTexture('pavers');this.asphalt=createSurfaceTexture('asphalt');this.waterTexture=createSurfaceTexture('water');
  this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.proj=new THREE.Vector3();this.timer=new THREE.Timer();this.timer.connect(document);this.dimensions=new Map();this.footprintBounds=data.buildings.map(b=>bounds(b.points));
  this.buildGround();this.buildSurfaces();this.fourInventionsPaving=buildFourInventionsPaving(this.scene);this.buildRoads();this.avenuePaving=addAvenuePaving(this.scene,this.data.roads);this.buildBuildings();this.buildLandmarks();this.buildingSilhouettes=createBuildingSilhouettes(this.data.buildings,{includeLibrary:false,includeMain:false});this.scene.add(this.buildingSilhouettes);this.buildTrees();this.foliageCoverageMaterials=enableFarFoliageCoverage(this.vegetation,this.renderer.getContext());this.buildFurniture();this.buildLabels();this.bind();this.resize();this.home(false);
  // Reproducible exterior photographic QA; normal visitors keep existing default camera.
  const inspection=new URLSearchParams(location.search).get('inspection');
  if(inspection)document.body.classList.add('photo-inspection');
  if(inspection==='north-gate'){
    const gate=this.data.landmarks.find(p=>p.name==='北门');
    if(gate){const [gx,gz]=gate.position;this.camera.position.set(gx,BASE+7,gz-(this.isMobile?195:92));this.controls.target.set(gx,BASE+5.5,gz-1);this.controls.update();}
  }else if(inspection==='north-wall'){
    this.camera.position.set(-126,BASE+5.2,-640);this.controls.target.set(-126,BASE+3.2,-563);this.controls.update();
  }else if(inspection==='library-plan'||inspection==='library-north'){
    const lib=this.data.buildings.find(b=>b.osmId===263624481);
    if(lib){const [x0,z0,x1,z1]=bounds(lib.points),cx=(x0+x1)/2,cz=(z0+z1)/2;
      this.camera.fov=this.isMobile?65:50;this.camera.updateProjectionMatrix();
      if(inspection==='library-plan'){
        // South at the top, matching the licensed 2025 aerial reference.
        this.camera.position.set(cx,BASE+(this.isMobile?285:210),cz-3);this.controls.target.set(cx,BASE,cz);
      }else{
        this.camera.position.set(cx+55,BASE+(this.isMobile?65:48),z0-(this.isMobile?230:150));this.controls.target.set(cx,BASE+8,z0+30);
      }this.controls.update();
    }
  }else if(inspection==='science-west'){
    const science=this.data.buildings.find(b=>b.osmId===263632364);
    if(science){const [cx,cz]=science.center;this.camera.fov=this.isMobile?65:48;this.camera.updateProjectionMatrix();this.camera.position.set(cx-(this.isMobile?240:180),BASE+(this.isMobile?78:62),cz+95);this.controls.target.set(cx-10,BASE+11,cz+10);this.controls.update();}
  }else if(inspection==='main-e'){
    const main=this.data.buildings.find(b=>b.osmId===263624057);
    if(main){const [x0,z0,x1,z1]=bounds(main.points);const cx=(x0+x1)/2;
      this.camera.fov=this.isMobile?64:48;this.camera.updateProjectionMatrix();this.camera.position.set(cx+6,BASE+47,z1+(this.isMobile?235:208));this.controls.target.set(cx,BASE+36,(z0+z1)/2);this.controls.update();}
  }else if(inspection==='avenue-ground'||inspection==='avenue-ground-oblique'){
    // The overview's polar limit lifts shallow views above the street.
    // Permit looking slightly upward only for these photographic QA views.
    this.controls.maxPolarAngle=Math.PI*.55;
    if(inspection==='avenue-ground'){
      this.camera.position.set(122.8,BASE+2,10);this.controls.target.set(121.5,BASE+5,-150);
    }else{
      this.camera.position.set(139,BASE+2,-18);this.controls.target.set(120,BASE+6,-115);
    }
    this.controls.update();
  }else if(inspection==='avenue-oblique'){
    this.camera.position.set(139,BASE+6.4,-18);this.controls.target.set(120,BASE+8,-115);this.controls.update();
  }else if(inspection==='avenue-east'){
    // Ground-level OSM road axis, independent of guessed single-tree coordinates.
    this.camera.position.set(122.8,BASE+3.3,10);this.controls.target.set(121.5,BASE+5,-150);this.controls.update();
  }
  this.animate();
  requestAnimationFrame(()=>{this.loadMs=performance.now()-this.startTime;ready?.();});
 }
 mat(color,options={}){return new THREE.MeshStandardMaterial({color,roughness:.9,metalness:0,...options});}
 mesh(g,m,{cast=false,receive=true,parent=this.scene}={}){if(!g)return null;const o=new THREE.Mesh(g,m);o.castShadow=cast;o.receiveShadow=receive;parent.add(o);return o;}
 merge(gs,mat,opts={}){gs=gs.filter(Boolean);if(!gs.length)return null;const g=mergeGeometries(gs,false);if(!g)throw Error('Geometry batch failed');gs.forEach(g=>g.dispose());return this.mesh(g,mat,opts);}
 buildGround(){
  this.ground=this.mesh(new THREE.PlaneGeometry(14000,14000),this.mat('#b7c6b4'));this.ground.rotation.x=-Math.PI/2;this.ground.position.y=-4;
  const gs=this.data.boundary.map(p=>extrude(p,4,-3));this.campusBase=this.merge(gs,this.mat('#d5d5bc'));
  const edges=[];for(const p of this.data.boundary){const vs=p.map(v=>new THREE.Vector3(v[0],BASE+.15,v[1]));edges.push(...vs.flatMap((v,i)=>i<vs.length-1?[v,vs[i+1]]:[]));}
  this.scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(edges),new THREE.LineBasicMaterial({color:'#526b5e',transparent:true,opacity:.95})));
  // The perimeter was previously only a flat line. Add real height, leave gate gaps.
  this.campusPerimeter=createCampusPerimeter(this.data.boundary,[...this.data.landmarks,...this.data.pois],BASE,this.data.roads,this.data.buildings);
  this.scene.add(this.campusPerimeter);
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
 buildRoads(){const curb=[],roads=[],avenues=[],paths=[],mark=[];for(const r of this.data.roads){const foot=/footway|path|steps|cycleway/.test(r.kind);if(foot){paths.push(ribbon(r.points,r.width,BASE+.115));continue;}curb.push(ribbon(r.points,r.width+2.5,BASE+.075));(/^(思源路|彭康路|学森路|文治路|梧桐东道|梧桐西道|学苑东路|学苑西路)$/.test(r.name||'')?avenues:roads).push(ribbon(r.points,r.width,BASE+(/^(思源路|彭康路|学森路|文治路|梧桐东道|梧桐西道|学苑东路|学苑西路)$/.test(r.name||'')?.145:.125)));
  if(r.width>=6&&r.name!=='梧桐东道'){let offset=0;for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<.1)continue;const dx=(b[0]-a[0])/len,dz=(b[1]-a[1])/len;for(let t=offset;t<len-1;t+=12)mark.push(ribbon([[a[0]+dx*t,a[1]+dz*t],[a[0]+dx*Math.min(t+3,len),a[1]+dz*Math.min(t+3,len)]],.22,BASE+.175));offset=(offset-len)%12;if(offset<0)offset+=12;}}
  }this.merge(curb,this.mat('#dfdeca',{map:this.pavers}));this.merge(roads,this.mat('#707b74',{map:this.asphalt}));this.merge(avenues,this.mat('#707b74',{map:this.asphalt}));this.merge(paths,this.mat('#d3cdb7',{map:this.pavers}));this.merge(mark,this.mat('#e5dfbd'));
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
   if(b.osmId===263624481){this.dimensions.set(b.id,{height:b.height,bounds:bounds(b.points)});b.displayHeight=49.75;return;}
   if(MAIN_IDS.includes(b.osmId)){const h=mainDisplayHeight(b.osmId);this.dimensions.set(b.id,{height:h,bounds:bounds(b.points)});b.displayHeight=h;return;}
   let h=b.height;
    // Gate-wing outlines are sourced from OSM, but their default 14m box height
    // is an unsupported estimate. Use low photo-informed facade massing here.
    if(b.osmId===264738601||b.osmId===264738602)h=5.3;
   const geo=extrude(b.points,h,BASE,b.holes);gs.push(this.colorGeometry(geo,b,i,c,roof));
   this.dimensions.set(b.id,{height:b.height,bounds:bounds(b.points)});
   // The photographed central opening replaces the earlier unverified solid roof cap.
  });
  // One draw call for every campus building; the attribute preserves per-building selection.
  for(const g of gs){this.buildingRanges.push([vertex,vertex+g.attributes.position.count]);vertex+=g.attributes.position.count;}
  this.buildingMesh=this.merge(gs,this.buildingMat(),{cast:true});this.pickables.push(this.buildingMesh);this.originalColors=this.buildingMesh.geometry.attributes.color.array.slice();
  const edge=new THREE.EdgesGeometry(this.buildingMesh.geometry,35);this.buildingEdges=new THREE.LineSegments(edge,new THREE.LineBasicMaterial({color:'#596959',transparent:true,opacity:.16}));this.scene.add(this.buildingEdges);
  const ac=[];for(const b of this.data.buildings){if(MAIN_IDS.includes(b.osmId)||b.area<350||/图书|主楼/.test(b.name))continue;const bb=bounds(b.points),x=(bb[0]+bb[2])/2,z=(bb[1]+bb[3])/2;if(pointIn([x,z],b.points))ac.push(boxGeometry(x,BASE+b.height+.15,z,Math.min(5,(bb[2]-bb[0])*.2),1.5,3));}this.merge(ac,this.mat('#c8d0c0'),{cast:true});
 }
 addClock(x,y,z,r){const cv=document.createElement('canvas');cv.width=cv.height=128;const c=cv.getContext('2d');c.fillStyle='#dce2d1';c.beginPath();c.arc(64,64,61,0,Math.PI*2);c.fill();c.strokeStyle='#526555';c.lineWidth=3;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;c.beginPath();c.moveTo(64+Math.sin(a)*48,64-Math.cos(a)*48);c.lineTo(64+Math.sin(a)*55,64-Math.cos(a)*55);c.stroke();}c.lineWidth=5;c.beginPath();c.moveTo(64,31);c.lineTo(64,64);c.lineTo(91,77);c.stroke();const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshBasicMaterial({map:tx,transparent:true});const o=this.mesh(new THREE.PlaneGeometry(r*2,r*2),m,{receive:false});o.position.set(x,y,z);}
 buildLandmarks(){
  const plaza=this.data.interpretive.find(p=>p.id==='interpretive/four-inventions');
  if(plaza&&!this.blocked(plaza.position,3)){
   this.fourInventionsMarker=createFourInventionsMarker(plaza.position);
   this.scene.add(this.fourInventionsMarker);
  }
  const stone=this.mat('#e6ddc4'),white=this.mat('#ece6d3'),gold=this.mat('#af9163',{metalness:.45,roughness:.4});this.landmarkGroup=new THREE.Group();this.scene.add(this.landmarkGroup);
  // Integrated Codex historic monument modules with the Mice Hole plaza reconstruction.
  const tower=this.data.landmarks.find(p=>p.name==='腾飞塔');
  if(tower){
   this.tengfeiTower=createTengfeiTower(tower.position);
   this.landmarkGroup.add(this.tengfeiTower);
   for(const m of this.tengfeiTower.children){m.userData.place=tower;this.pickables.push(m);}
  }
  const siyuan=this.data.interpretive.find(p=>p.name==='饮水思源碑');
  if(siyuan){
   this.siyuanStele=createSiyuanStele(siyuan.position);
   this.landmarkGroup.add(this.siyuanStele);
  }  const gate=this.data.landmarks.find(p=>p.name==='北门');if(gate){this.northGate=createNorthGate(gate.position,BASE);this.northGateWorldPosition=new THREE.Vector3(gate.position[0],BASE,gate.position[1]);this.landmarkGroup.add(this.northGate);for(const m of this.northGate.children){if(m.name==='outer entry pier'||m.name==='sweeping white gate roof'){m.userData.place=gate;this.pickables.push(m);}}}
  this.secondaryGates=[];for(const entry of getCampusGateEntries(this.data)){const gateGeometry=entry.name==='南门'?createSouthGate(entry.position,BASE,entry.passagePositions):createSecondaryGate({position:visualGatePosition(entry),name:entry.name,baseY:BASE,orientation:Math.PI/2});this.landmarkGroup.add(gateGeometry);this.secondaryGates.push(gateGeometry);}
   const lib=this.data.buildings.find(b=>b.osmId===263624481);if(lib){
    this.libraryAsset=createLibraryAsset({building:lib,baseY:BASE,buildingIndex:this.data.buildings.indexOf(lib),uniforms:{selection:this.selection,hover:this.hover,night:this.night},stage:this.libraryReviewStage||'material'});
    this.scene.add(this.libraryAsset);this.libraryMassing={source:'R11 unified asset',zones:this.libraryAsset.userData.plan.zones.map(z=>({id:z.id,levels:z.rows,height:z.top})),footprintUnchanged:true};
    this.libraryAsset.traverse(mesh=>{if(mesh.isMesh)this.pickables.push(mesh);});
    const bb=bounds(lib.points);this.libraryForecourt=createLibraryForecourt({centerX:(bb[0]+bb[2])/2,facadeFrontZ:bb[3],baseY:BASE});this.scene.add(this.libraryForecourt);
   }
  const siyuanCenter=this.data.buildings.find(b=>b.osmId===263624056);
  if(siyuanCenter){this.siyuanCenterFacade=createSiyuanCenter({footprint:bounds(siyuanCenter.points),height:siyuanCenter.height,baseY:BASE});this.scene.add(this.siyuanCenterFacade);}
  const scienceHall=this.data.buildings.find(b=>b.osmId===263632364);
  if(scienceHall){this.scienceHallFacade=createScienceHall({footprint:bounds(scienceHall.points),height:scienceHall.height,baseY:BASE});this.scene.add(this.scienceHallFacade);}
  this.mainComplexAsset=createMainComplexAsset({buildings:this.data.buildings,baseY:BASE,uniforms:{selection:this.selection,hover:this.hover},stage:this.buildingReviewStage||'material'});this.scene.add(this.mainComplexAsset);this.mainComplexAsset.traverse(mesh=>{if(mesh.isMesh)this.pickables.push(mesh);});
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

   const canPlant=p=>!this.blocked(p,2)&&!waters.some(s=>pointIn(p,s.points))&&!entranceAxis(p);const used=new Set();const add=(x,z,type=0)=>{const key=Math.round(x/5)+','+Math.round(z/5);if(used.has(key))return;used.add(key);trees.push({x,z,h:type===2?15+random()*4:7+random()*5,r:type===2?4.0+random()*1.7:3.1+random()*2.2,c:random(),type});};
  for(const s of this.data.surfaces.filter(s=>s.kind==='wood'||s.kind==='green')){const [x0,z0,x1,z1]=bounds(s.points);const spacing=s.kind==='wood'?11:15;for(let x=x0+4;x<x1;x+=spacing)for(let z=z0+4;z<z1;z+=spacing){const p=[x+(random()-.5)*7,z+(random()-.5)*7];if(pointIn(p,s.points)&&canPlant(p)&&this.roadDistance(p)>1.5&&random()>.08)add(...p,s.kind==='wood'&&random()>.74?1:0);}}
  for(const r of this.data.roads.filter(r=>r.campus&&!/steps|path|footway|cycleway/.test(r.kind))){for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<14)continue;const dx=(b[0]-a[0])/len,dz=(b[1]-a[1])/len;for(let t=7;t<len-3;t+=16)for(const side of [-1,1]){const p=[a[0]+dx*t-dz*(r.width/2+4)*side,a[1]+dz*t+dx*(r.width/2+4)*side];if(this.data.boundary.some(b=>pointIn(p,b))&&canPlant(p)&&this.roadDistance(p)>2.2)add(...p,/梧桐|彭康|思源|学森|文治|学苑/.test(r.name||'')?2:0);}}}
  for(let i=0;i<trees.length;i++)trees[i]=fitTreeToBuildings(trees[i],this.data.buildings);this.treePositions=trees;this.treeCells=new Map();for(const t of trees){const key=Math.floor(t.x/12)+','+Math.floor(t.z/12);if(!this.treeCells.has(key))this.treeCells.set(key,[]);this.treeCells.get(key).push(t);}this.treeCount=trees.length;
   const avenueTrees=trees.filter(t=>t.type===2);
   this.avenueTreeCount=avenueTrees.length;
   this.vegetation=createCampusVegetation(trees,{mobile:this.isMobile});
   this.trees=this.vegetation.group;
   this.trees.name='plane tree branching / photo-inspired, positions approximate';
   this.treeCrowns=this.trees.children.filter(m=>m.name.includes('leaf sprays'));
   this.scene.add(this.trees);
 }

 buildFurniture(){const lamps=[],benches=[];let k=0;for(const r of this.data.roads.filter(r=>r.campus&&r.width>=6)){for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);const dx=(b[0]-a[0])/(len||1),dz=(b[1]-a[1])/(len||1);for(let t=17;t<len;t+=48){const x=a[0]+dx*t-dz*(r.width/2+1.6),z=a[1]+dz*t+dx*(r.width/2+1.6);if(this.blocked([x,z]))continue;lamps.push({x,z});if(k++%3===0)benches.push(boxGeometry(x-dz*2,BASE+.6,z+dx*2,2.8,.35,.8));}}}this.merge(benches,this.mat('#967b5c'),{cast:true});
  const pole=new THREE.InstancedMesh(new THREE.CylinderGeometry(.1,.16,5.5,5),this.mat('#67786a'),lamps.length);this.lampMaterial=new THREE.MeshStandardMaterial({color:'#f4e5b1',emissive:'#ffd68a',emissiveIntensity:0,roughness:.45});const lamp=new THREE.InstancedMesh(new THREE.SphereGeometry(.55,6,4),this.lampMaterial,lamps.length);const dummy=new THREE.Object3D();lamps.forEach((p,i)=>{dummy.position.set(p.x,BASE+2.75,p.z);dummy.updateMatrix();pole.setMatrixAt(i,dummy.matrix);dummy.position.y=BASE+5.7;dummy.updateMatrix();lamp.setMatrixAt(i,dummy.matrix);});this.scene.add(pole,lamp);
 }
 buildLabels(){const priority=[263624481,263624057,263625088,1167525875,263632364,264106085,263625679,263624056,263808678,263808685];const named=this.data.buildings.filter(b=>b.name!=='未命名建筑');const ordered=named.slice().sort((a,b)=>(priority.indexOf(a.osmId)<0?999:priority.indexOf(a.osmId))-(priority.indexOf(b.osmId)<0?999:priority.indexOf(b.osmId)));const otherGates=getCampusGateEntries(this.data);const places=[...this.data.landmarks,...otherGates,...ordered,...this.data.interpretive];for(const p of places){const el=document.createElement('button');el.className='label';el.setAttribute('aria-label','查看'+p.name);const dot=document.createElement('i');const span=document.createElement('span');span.textContent=p.name.replace('西安交通大学','').replace('南洋书院 ','南洋 · ').replace('仲英书院 ','仲英 · ');el.append(dot,span);el.addEventListener('pointerdown',e=>e.stopPropagation());el.addEventListener('click',()=>this.onSelect(p));document.querySelector('#labels').appendChild(el);const i=this.data.buildings.indexOf(p);this.labelItems.push({place:p,el,index:i,priority:places.indexOf(p),pos:new THREE.Vector3((p.center||p.position)[0],(p.name==='南门'?17:p.name==='北门'?16:(p.displayHeight||p.height||7)+BASE+4),(p.center||p.position)[1])});}
 }
 bind(){const cv=this.renderer.domElement;let down=null,dragging=false,pressHandled=false,pressTimer=null;const activePointers=new Set();
 const clearPress=()=>{if(pressTimer!==null){clearTimeout(pressTimer);pressTimer=null;}};
 const pickAt=(x,y)=>{const rect=cv.getBoundingClientRect();this.pointer.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hit=this.ray.intersectObjects(this.pickables,false)[0];return hit?this.hitPlace(hit)?.place:null;};
 cv.addEventListener('pointerdown',e=>{activePointers.add(e.pointerId);clearPress();if(activePointers.size>1){down=null;dragging=true;return;}
  this.cancelFlight();if(this.tour)this.endTour();down={x:e.clientX,y:e.clientY};dragging=false;pressHandled=false;
  if(this.mode==='walk')cv.setPointerCapture(e.pointerId);
  if(this.mode==='orbit'&&e.pointerType==='touch')pressTimer=setTimeout(()=>{if(!down||dragging||activePointers.size!==1)return;pressHandled=true;const place=pickAt(e.clientX,e.clientY);if(place)this.onSelect(place);else this.notify('长按地图可探索建筑，双指可缩放与旋转');},560);
 },{capture:true});cv.addEventListener('pointermove',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)clearPress();
   if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)dragging=true;
   if(this.mode==='walk'&&down){this.walkYaw-=(e.movementX||e.clientX-down.x)*.0035;this.walkPitch=Math.max(-1.25,Math.min(1.25,this.walkPitch-(e.movementY||e.clientY-down.y)*.0035));down={x:e.clientX,y:e.clientY};this.applyWalkLook();return;}
   if(this.mode==='orbit'&&!down&&e.pointerType==='mouse'){this.pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hit=this.ray.intersectObjects(this.pickables,false)[0];const tooltip=document.querySelector('#tooltip');if(hit){const p=this.hitPlace(hit);this.hover.value=p?.index??-1;cv.style.cursor='pointer';tooltip.textContent=p?.place.name||'';tooltip.hidden=false;tooltip.style.left=Math.min(innerWidth-240,e.clientX+15)+'px';tooltip.style.top=(e.clientY+16)+'px';}else{this.hover.value=-1;cv.style.cursor='grab';tooltip.hidden=true;}}
  });cv.addEventListener('pointerup',e=>{clearPress();if(down&&!dragging&&!pressHandled&&activePointers.size===1&&this.mode==='orbit'){const place=pickAt(e.clientX,e.clientY);if(place)this.onSelect(place);}activePointers.delete(e.pointerId);down=null;dragging=false;});cv.addEventListener('pointercancel',e=>{clearPress();activePointers.delete(e.pointerId);down=null;dragging=false;});cv.addEventListener('pointerleave',()=>{this.hover.value=-1;document.querySelector('#tooltip').hidden=true;});cv.addEventListener('wheel',()=>{this.cancelFlight();this.endTour();},{passive:true});
  addEventListener('resize',()=>this.resize());addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.code==='Escape'){if(this.mode==='walk')this.exitWalk();else this.endTour();}if(this.mode==='walk'&&/Key[WASD]|Arrow|Shift/.test(e.code)){e.preventDefault();this.keys.add(e.code);}});addEventListener('keyup',e=>this.keys.delete(e.code));addEventListener('blur',()=>this.keys.clear());
  cv.addEventListener('webglcontextlost',e=>{e.preventDefault();this.contextLost=true;this.notify('图形上下文已暂停。请重新加载页面恢复画面。');});
  cv.addEventListener('webglcontextrestored',()=>{this.contextLost=false;this.resize();this.vegetation?.update(this.camera,performance.now(),true);this.timer.update();});
   document.addEventListener('visibilitychange',()=>{if(document.hidden)this.keys.clear();else{this.resize();this.timer.update();}});
   addEventListener('pageshow',()=>{if(!this.contextLost)this.resize();});
 }
 hitPlace(hit){if(hit.object===this.buildingMesh||hit.object.userData.buildingAssetMesh){const i=Math.round(hit.object.geometry.attributes.buildingIndex.getX(hit.face.a));return{place:this.data.buildings[i],index:i};}return{place:hit.object.userData.place,index:hit.object.userData.buildingIndex??-1};}
 resize(){const w=Math.max(1,document.documentElement.clientWidth),h=Math.max(1,window.innerHeight);this.width=w;this.height=h;this.isMobile=w<=768;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setPixelRatio(renderPixelRatio({width:w,height:h,deviceRatio:devicePixelRatio,quality:this.qualityMode}));this.renderer.setSize(w,h);this.lastDeviceRatio=devicePixelRatio;this.sky.visible=this.lightMode!=='night'&&!this.isMobile;}
 constrainOrbitToCampus(){if(this.mode!=='orbit')return;const t=this.controls.target,oldX=t.x,oldZ=t.z,oldY=t.y;t.x=THREE.MathUtils.clamp(t.x,-850,920);t.z=THREE.MathUtils.clamp(t.z,-780,850);t.y=THREE.MathUtils.clamp(t.y,0,120);if(t.x!==oldX||t.z!==oldZ||t.y!==oldY){this.camera.position.x+=t.x-oldX;this.camera.position.z+=t.z-oldZ;this.camera.position.y+=t.y-oldY;}}
 cancelFlight(){if(this.flight){this.flight=null;this.controls.enabled=this.mode!=='walk';}this.controls.autoRotate=this.auto;}
 fly(position,target,duration=1500){if(this.mode==='walk')this.exitWalk();this.flight={start:performance.now(),duration:this.reduced?0:duration,from:this.camera.position.clone(),to:new THREE.Vector3(...position),targetFrom:this.controls.target.clone(),targetTo:new THREE.Vector3(...target),fovFrom:this.camera.fov,fovTo:this.camera.fov};this.controls.enabled=false;}
 home(animate=true){this.camera.fov=39;this.camera.updateProjectionMatrix();this.endTour();if(this.mode==='walk')this.exitWalk();this.setAuto(false);const mobile=innerWidth<=768;const target=mobile?[-25,0,-50]:[25,0,-50];const position=mobile?[790,1370,1390]:[930,1000,1190];if(animate)this.fly(position,target);else{this.camera.position.set(...position);this.controls.target.set(...target);this.controls.update();}this.onMode('home');}
 top(){this.camera.fov=39;this.camera.updateProjectionMatrix();this.endTour();this.setAuto(false);const mobile=innerWidth<=768;this.fly([mobile?-30:30,1450,-49],[mobile?-30:30,0,-50]);this.onMode('top');}
 north(){if(this.mode==='walk')return;const t=this.controls.target,d=this.camera.position.distanceTo(t),polar=this.controls.getPolarAngle();this.fly([t.x,t.y+Math.cos(polar)*d,t.z+Math.sin(polar)*d],[t.x,t.y,t.z]);}
 zoom(factor){if(this.mode==='walk')return;const offset=this.camera.position.clone().sub(this.controls.target).multiplyScalar(factor);const d=offset.length();offset.setLength(Math.max(35,Math.min(2450,d)));this.fly(this.controls.target.clone().add(offset).toArray(),this.controls.target.toArray(),400);}
 setAuto(value){if(this.mode==='walk')this.exitWalk();this.auto=value;this.controls.autoRotate=value&&!this.reduced;const btn=document.querySelector('#orbit-btn');btn.classList.toggle('active',value);btn.setAttribute('aria-pressed',String(value));if(value&&this.reduced)this.notify('系统已开启减弱动态效果，自动环绕保持静止。');return value;}
 showBuildingGroup(p){
  const frame=buildingGroupFrame(p,this.data.buildings,this.width,this.height);if(!frame)return;
  if(this.mode==='walk')this.exitWalk();this.endTour();this.setAuto(false);
  this.camera.fov=frame.fov;this.camera.updateProjectionMatrix();
  this.groupView={name:p.name,ids:frame.ids,status:frame.status};this.fly(frame.position,frame.target,1400);
 }
 north(){if(this.mode==='walk')return;const t=this.controls.target,d=this.camera.position.distanceTo(t),polar=this.controls.getPolarAngle();this.fly([t.x,t.y+Math.cos(polar)*d,t.z+Math.sin(polar)*d],[t.x,t.y,t.z]);}
 zoom(factor){if(this.mode==='walk')return;const offset=this.camera.position.clone().sub(this.controls.target).multiplyScalar(factor);const d=offset.length();offset.setLength(Math.max(35,Math.min(2450,d)));this.fly(this.controls.target.clone().add(offset).toArray(),this.controls.target.toArray(),400);}
 setAuto(value){if(this.mode==='walk')this.exitWalk();this.auto=value;this.controls.autoRotate=value&&!this.reduced;const btn=document.querySelector('#orbit-btn');btn.classList.toggle('active',value);btn.setAttribute('aria-pressed',String(value));if(value&&this.reduced)this.notify('系统已开启减弱动态效果，自动环绕保持静止。');return value;}
 focus(p,fly=true){const previousFov=this.camera.fov;const i=this.data.buildings.indexOf(p);this.selected=i;this.selectedPlace=p;this.selection.value=i;this.labelItems.forEach(l=>l.el.classList.toggle('selected',l.place.id===p.id));const c=p.center||p.position,h=p.displayHeight||p.height||18;const dim=p.points?bounds(p.points):null;const size=dim?Math.max(dim[2]-dim[0],dim[3]-dim[1]):35;const dist=Math.max(120,size*1.6,h*2.2);this.setAuto(false);if(fly){const gate=p.name==='北门'||p.name==='南门';const sideGate=p.gateType==='osm-point';const sidePos=sideGate?visualGatePosition(p):c;this.camera.fov=this.isMobile&&p.name==='南门'?48:gate&&this.isMobile?65:39;this.camera.updateProjectionMatrix();const exterior=p.name==='北门'?-1:1;const plaza=p.id==='interpretive/four-inventions';const library=p.osmId===263624481;const libraryFrame=library?libraryEntranceFrame(p,this.data.buildings,this.width,this.height):null;if(plaza&&this.isMobile){this.camera.fov=70;this.camera.updateProjectionMatrix();}if(libraryFrame){this.camera.fov=libraryFrame.fov;this.camera.updateProjectionMatrix();}const position=sideGate?[sidePos[0]+(/东/.test(p.name)?33:-33),BASE+(this.isMobile?19:23),sidePos[1]+25]:gate?(this.isMobile?[c[0],p.name==='南门'?22:30,c[1]+exterior*(p.name==='南门'?124:150)]:[c[0]+24,30,c[1]+exterior*135]):plaza?(this.isMobile?[c[0]+56,57,c[1]-96]:[c[0]+56,57,c[1]-96]) :libraryFrame?libraryFrame.position:[c[0]+dist*.8,Math.max(h+dist*.65,80),c[1]+dist*1.1];const target=sideGate?[sidePos[0],BASE+2,sidePos[1]]:gate?[c[0],7.7,c[1]]:plaza?[c[0]+(this.isMobile?-7:0),2.0,c[1]] :libraryFrame?libraryFrame.target:[c[0],h*.25,c[1]];this.fly(position,target,1400);if(this.flight){this.flight.fovFrom=previousFov;this.flight.fovTo=this.camera.fov;this.camera.fov=previousFov;this.camera.updateProjectionMatrix();}}}
 clearSelection(){this.selection.value=-1;this.selected=-1;this.selectedPlace=null;this.labelItems.forEach(l=>l.el.classList.remove('selected'));}
 setColors(mode){this.mainComplexAsset?.setColorMode(mode);this.libraryAsset?.setColorMode(mode);this.colorMode.value=mode==='natural'?0:1;const attr=this.buildingMesh.geometry.attributes.color,ids=this.buildingMesh.geometry.attributes.buildingIndex;if(mode==='natural')attr.array.set(this.originalColors);else for(let i=0;i<attr.count;i++){const b=this.data.buildings[Math.round(ids.getX(i))];const c=new THREE.Color(mode==='category'?CATEGORY[b.category]:b.heightSource==='official-document-height'?'#6297b9':b.levels?'#79b7a1':'#cda779');if(this.buildingMesh.geometry.attributes.normal.getY(i)>.8)c.multiplyScalar(.85);c.toArray(attr.array,i*3);}attr.needsUpdate=true;}
 lighting(mode){this.lightMode=mode;const night=mode==='night',dusk=mode==='dusk';this.night.value=night?1:dusk?.3:0;this.scene.background.set(SKY[mode]);this.scene.fog.color.set(SKY[mode]);this.scene.fog.near=night?1400:1800;this.ground.material.color.set(night?'#425454':dusk?'#b8b7a2':'#b7c6b4');this.hemi.intensity=night?.75:dusk?1.4:1.75;this.hemi.color.set(night?'#a4c7dc':dusk?'#c4c7d7':'#e4f0ec');this.sun.intensity=night?.4:dusk?2.0:2.6;this.sun.color.set(night?'#9cbed7':dusk?'#ffc79c':'#fff0cf');this.sun.position.set(dusk?-900:-650,dusk?350:1000,450);this.fill.intensity=night?.25:.6;this.lampMaterial.emissiveIntensity=night?2:dusk?.7:0;this.renderer.toneMappingExposure=night?1.0:1.06;this.sky.visible=!night&&!this.isMobile;this.sky.material.uniforms.sunPosition.value.copy(this.sun.position);this.sky.material.uniforms.rayleigh.value=dusk?1.8:.85;this.sky.material.uniforms.turbidity.value=dusk?7:3;document.body.classList.toggle('night',night);}
 quality(mode){this.qualityMode=mode==='high'?'high':'low';this.renderer.shadowMap.enabled=this.qualityMode==='high';this.resize();this.buildingMesh.material.needsUpdate=true;}
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
  if(!this.data.boundary.some(b=>pointIn(point,b))||this.blocked(point,margin)||perimeterBlocksPosition(this.campusPerimeter,point,margin))return false;
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
       canBlock:(q,margin)=>this.blocked(q,margin)||perimeterBlocksPosition(this.campusPerimeter,q,margin)
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
  const fromPosition=this.camera.position.clone(),fromQuaternion=this.camera.quaternion.clone(),fromFov=this.camera.fov;
  this.camera.fov=62;this.camera.near=.2;this.camera.updateProjectionMatrix();
  this.camera.position.set(start[0],BASE+2,start[1]);
  const look=this.walkSpawn?.target||(p?(p.center||p.position):[start[0],start[1]+50]);
  this.walkYaw=p?Math.atan2(start[0]-look[0],start[1]-look[1]):Math.PI;
  this.walkPitch=p?Math.atan2((p.displayHeight||p.height||8)*.32-2,Math.max(20,Math.hypot(start[0]-look[0],start[1]-look[1]))):0;
  this.applyWalkLook();const destination=this.camera.position.clone(),toQuaternion=this.camera.quaternion.clone();
  this.walkTransition={start:performance.now(),duration:this.reduced?0:1050,fromPosition,fromQuaternion,fromFov,destination,toQuaternion,toFov:62};
  this.camera.position.copy(fromPosition);this.camera.quaternion.copy(fromQuaternion);this.camera.fov=fromFov;this.camera.updateProjectionMatrix();
  this.keys.clear();this.onMode('walk');
 }
 applyWalkLook(){this.camera.rotation.order='YXZ';this.camera.rotation.set(this.walkPitch,this.walkYaw,0);}
 exitWalk(){if(this.mode!=='walk')return;
  this.walkTransition=null;const forward=new THREE.Vector3();this.camera.getWorldDirection(forward);
  const from=this.camera.position.clone(),currentTarget=from.clone().addScaledVector(forward,85);
  const destination=from.clone().add(new THREE.Vector3(-forward.x*72,93,-forward.z*72));
  const target=currentTarget.clone();target.y=BASE+Math.min(16,Math.max(0,target.y-BASE));
  this.mode='orbit';this.camera.near=1.5;this.camera.updateProjectionMatrix();
  this.controls.target.copy(currentTarget);this.controls.enabled=true;this.controls.listenToKeyEvents(window);this.keys.clear();
  this.fly(destination.toArray(),target.toArray(),1000);if(this.flight)this.flight.fovTo=39;
  this.onMode('orbit');
 }
 moveWalk(dt){let f=0,s=0;if(this.keys.has('KeyW')||this.keys.has('ArrowUp'))f++;if(this.keys.has('KeyS')||this.keys.has('ArrowDown'))f--;if(this.keys.has('KeyD')||this.keys.has('ArrowRight'))s++;if(this.keys.has('KeyA')||this.keys.has('ArrowLeft'))s--;if(!f&&!s)return;const norm=Math.hypot(f,s);f/=norm;s/=norm;const step=(this.keys.has('ShiftLeft')||this.keys.has('ShiftRight')?12:5)*Math.min(dt,.06);const dx=(-Math.sin(this.walkYaw)*f+Math.cos(this.walkYaw)*s)*step;const dz=(-Math.cos(this.walkYaw)*f-Math.sin(this.walkYaw)*s)*step;const p=this.camera.position;const valid=(x,z)=>this.isWalkable([x,z],.65);if(valid(p.x+dx,p.z))p.x+=dx;if(valid(p.x,p.z+dz))p.z+=dz;p.y=BASE+2;}
 startTour(stops){this.exitWalk();this.setAuto(false);this.tour={stops,index:-1,paused:false,next:0};this.nextTour();}
 nextTour(){if(!this.tour)return;const t=this.tour;t.index=(t.index+1)%t.stops.length;const p=t.stops[t.index];this.focus(p);this.onSelect(p,false);t.next=performance.now()+8000;this.onTour?.(t);}
 endTour(){if(this.tour){this.tour=null;this.onTour?.(null);}}
 updateLabels(){if(this.width<=768&&this.selectedPlace){this.labelItems.forEach(item=>{item.el.hidden=true;});return;}if(this.selectedPlace&&(this.selectedPlace.osmId===263624481||this.selectedPlace.id==='way/263624481')){this.labelItems.forEach(item=>{item.el.hidden=true;});return;}const used=[];const usedNames=new Set();const dist=this.camera.position.distanceTo(this.controls.target);const gateFocus=['北门','南门','东北门','东南门','西北门','西南门'].includes(this.selectedPlace?.name);const photoFocus=this.selectedPlace?.osmId===263624481;const focusPos=this.selectedPlace&&(this.selectedPlace.position||this.selectedPlace.center);const maxLabels=this.width<=768?(dist>900?0:dist>450?2:3):dist>1400?5:9;for(const item of this.labelItems){const selected=item.place.id===this.selectedPlace?.id;let visible=this.labelsEnabled&&this.mode!=='walk'&&!((gateFocus||photoFocus)&&selected)&&(selected||(!(gateFocus||photoFocus)&&(item.priority<11||dist<600&&item.priority<45||dist<320)));if(visible){const v=this.proj.copy(item.pos).project(this.camera);const x=(v.x+1)/2*this.width,y=(1-v.y)/2*this.height;const w=Math.min(this.width<=768?132:180,item.place.name.length*(this.width<=768?9:10)+22);visible=v.z<1&&v.z>-1&&x>w/2+6&&x<this.width-w/2-8&&y>(this.width<=768?142:99)&&y<this.height-(this.width<=768?175:105);if(visible&&!selected){if(item.priority<12&&dist<800){if(item.occluded===undefined||this.frames%10===item.priority%10){const toLabel=this.proj.copy(item.pos).sub(this.camera.position);const labelDistance=toLabel.length();this.ray.set(this.camera.position,toLabel.normalize());const front=this.ray.intersectObject(this.buildingMesh,false)[0];item.occluded=!!(front&&front.distance<labelDistance-5&&this.hitPlace(front)?.place?.id!==item.place.id);}if(item.occluded)visible=false;}if(used.length>=maxLabels)visible=false;if(this.width>768&&x<327)visible=false;if(this.width>768&&x>this.width-220&&y>this.height-315)visible=false;if(used.some(r=>Math.abs(r.x-x)<(r.w+w)/2+13&&Math.abs(r.y-y)<35)){item.overlapFrames=(item.overlapFrames||0)+1;if(item.overlapFrames>0)visible=false;}else item.overlapFrames=0;}if(visible&&usedNames.has(item.place.name))visible=false;if(visible){usedNames.add(item.place.name);const moved=item.screen?Math.hypot(x-item.screen.x,y-item.screen.y):Infinity;const stamp=performance.now();const elapsed=stamp-(item.screenStamp??stamp-16);const smoothing=moved<170?1-Math.exp(-Math.max(8,Math.min(250,elapsed))/75):1;const sx=item.screen?(moved<170&&elapsed<36?item.screen.x*.46+x*.54:item.screen.x+(x-item.screen.x)*smoothing):x,sy=item.screen?(moved<170&&elapsed<36?item.screen.y*.46+y*.54:item.screen.y+(y-item.screen.y)*smoothing):y;item.screen={x:sx,y:sy};item.screenStamp=stamp;item.el.style.left=Math.round(sx)+'px';item.el.style.top=Math.round(sy)+'px';used.push({x:sx,y:sy,w});}}item.el.hidden=!visible;}}
 drawMinimap(){const canvas=document.querySelector('#minimap');if(!canvas||innerWidth<=768)return;const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;const scale=Math.min((w-18)/1210,(h-15)/1180);const ox=132,oz=150;const cv=p=>[p[0]*scale+ox,p[1]*scale+oz];this.miniTransform={scale,ox,oz};c.clearRect(0,0,w,h);const poly=(ps,color,stroke)=>{c.beginPath();ps.forEach((p,i)=>{const [x,y]=cv(p);i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();if(color){c.fillStyle=color;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}};for(const p of this.data.boundary)poly(p,'#e0e6d4','#839a72');for(const s of this.data.surfaces)poly(s.points,s.kind==='water'?'#9bbdb2':s.kind==='pitch'?'#a1b783':'#b8caa3');for(const r of this.data.roads.filter(r=>r.campus)){c.beginPath();r.points.forEach((p,i)=>{const q=cv(p);i?c.lineTo(...q):c.moveTo(...q);});c.strokeStyle='#f2efdf';c.lineWidth=Math.max(1,r.width*scale);c.stroke();}for(const b of this.data.buildings)poly(b.points,b.id===this.selectedPlace?.id?'#65875a':'#b1b89e');const cp=cv([this.controls.target.x,this.controls.target.z]);c.strokeStyle='#6d8c56';c.lineWidth=1.3;c.beginPath();c.arc(...cp,13,0,Math.PI*2);c.stroke();c.fillStyle='#507842';c.beginPath();c.arc(...cp,3,0,Math.PI*2);c.fill();const cam=cv([this.camera.position.x,this.camera.position.z]);c.strokeStyle='#557c4855';c.beginPath();c.moveTo(...cp);c.lineTo(...cam);c.stroke();}
 animate(){requestAnimationFrame(()=>this.animate());if(document.hidden||this.contextLost)return;if(devicePixelRatio!==this.lastDeviceRatio)this.resize();this.timer.update();const rawDt=this.timer.getDelta(),dt=Math.min(rawDt,.1),now=performance.now();this.frames++;if(rawDt>0){this.frameTimes.push(rawDt);if(this.frameTimes.length>120)this.frameTimes.shift();this.fps=this.frameTimes.length/this.frameTimes.reduce((a,b)=>a+b,0);}if(this.mode==='walk'){if(this.walkTransition){const tr=this.walkTransition,t=tr.duration===0?1:Math.min((now-tr.start)/tr.duration,1),e=t*t*(3-2*t);this.camera.position.lerpVectors(tr.fromPosition,tr.destination,e);this.camera.quaternion.slerpQuaternions(tr.fromQuaternion,tr.toQuaternion,e);this.camera.fov=THREE.MathUtils.lerp(tr.fromFov,tr.toFov,e);this.camera.updateProjectionMatrix();if(t===1){this.walkTransition=null;this.applyWalkLook();}}else this.moveWalk(dt);}else if(this.flight){const f=this.flight,t=f.duration===0?1:Math.min((now-f.start)/f.duration,1),e=t*t*(3-2*t);this.camera.position.lerpVectors(f.from,f.to,e);this.controls.target.lerpVectors(f.targetFrom,f.targetTo,e);if(f.fovFrom!==f.fovTo){this.camera.fov=THREE.MathUtils.lerp(f.fovFrom,f.fovTo,e);this.camera.updateProjectionMatrix();}this.camera.lookAt(this.controls.target);if(t===1){this.flight=null;this.controls.enabled=true;this.controls.update();}}else{this.controls.update(dt);this.constrainOrbitToCampus();keepOrbitAboveGround(this.camera,BASE);}
   if(this.mode==='orbit')keepOrbitAboveGround(this.camera,BASE);
  if(this.tour&&!this.tour.paused&&now>this.tour.next)this.nextTour();
  if(this.northGate){const gateDistance=this.camera.position.distanceTo(this.northGateWorldPosition);this.northGate.visible=gateDistance<(this.northGate.visible?950:800);}this.vegetation?.update(this.camera,now);this.renderer.render(this.scene,this.camera);this.updateLabels();if(this.frames%10===0){this.drawMinimap();const needle=document.querySelector('#compass-needle');needle.style.transform=`rotate(${-this.controls.getAzimuthalAngle()*180/Math.PI}deg)`;document.querySelector('#view-height').textContent=this.mode==='walk'?'地面 · 2 m':`视点 ${Math.round(this.camera.position.y)} m`;}if(this.frames%60===0)this.container.dataset.runtime=JSON.stringify(this.diagnostics());
 }
 diagnostics(){return{buildings:this.data.buildings.length,roads:this.data.roads.length,surfaces:this.data.surfaces.length,trees:this.treeCount,vegetation:this.vegetation?.group.userData,foliageCoverageMaterials:this.foliageCoverageMaterials,libraryMassing:this.libraryMassing,groupView:this.groupView,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures,fps:Math.round(this.fps),frameStats:framePercentiles(this.frameTimes),quality:this.qualityMode,renderPixelRatio:this.renderer.getPixelRatio(),canvasPixels:this.renderer.domElement.width*this.renderer.domElement.height,sceneLoadMs:Math.round(this.loadMs),mode:this.mode,walkTransition:!!this.walkTransition,cameraFlight:!!this.flight,walkStart:this.walkStart||null,light:this.lightMode,selected:this.selectedPlace?.name||null,webgl:'WebGL 2',camera:this.camera.position.toArray(),target:this.controls.target.toArray(),contextLost:!!this.contextLost,walkSpawn:this.walkSpawn||null,visibleLabels:this.labelItems.filter(l=>!l.el.hidden).length,reducedMotion:this.reduced,finiteGeometry:[...this.buildingMesh.geometry.attributes.position.array].every(Number.isFinite)};}
}
