import * as THREE from 'three';
import {boxGeometry} from './geo.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Interpretive south facade, not measured architectural documentation.
// All coordinates are in the campus-local metre system. Keep the existing
// OSM footprint and the documented 49.75 m volume as the source of truth.
export function createLibraryFacade({centerX,stairFrontZ,steppedCenterZ,baseY}){
  const group=new THREE.Group();
  group.name='Qian Xuesen Library — indicative south facade';
  const batches={glass:[],mullion:[],stone:[],roof:[],steps:[]};
  const add=(kind,x,y,z,w,h,d)=>{
    if(w<=0||h<=0||d<=0)throw Error('Invalid library facade geometry');
    batches[kind].push(boxGeometry(x,y,z,w,h,d));
  };

  const tiers=[
    {w:85,d:35,h:7,glazing:29},
    {w:68,d:31,h:13,glazing:18},
    {w:49,d:28,h:20,glazing:18},
    {w:32,d:25,h:26,glazing:15},
    {w:17,d:20,h:29.75,glazing:9}
  ];
  let previous=0;
  for(let level=0;level<tiers.length;level++){
    const tier=tiers[level],visible=tier.h-previous;
    // The highest tiers are set back, not superimposed onto the outer face.
    const south=steppedCenterZ+tier.d/2+.11;
    const bottom=baseY+13+previous+.11;
    const top=baseY+13+tier.h;
    const paneH=Math.max(.5,visible-.55);
    const width=tier.glazing;
    add('glass',centerX,bottom+.23,south,width,paneH,.28);
    const bays=Math.max(2,Math.round(width/3.2));
    for(let i=0;i<=bays;i++){
      const x=centerX-width/2+i*width/bays;
      add('mullion',x,bottom+.12,south+.2,.16,visible-.18,.27);
    }
    add('mullion',centerX,top-.32,south+.19,width+.5,.26,.36);
    add('stone',centerX-width/2-.75,bottom,south+.08,1.1,visible,.65);
    add('stone',centerX+width/2+.75,bottom,south+.08,1.1,visible,.65);
    // Thin parapet emphasizes the real stepped silhouette even at a distance.
    add('roof',centerX,top-.35,south-.05,Math.max(width+3,tier.w*.82),.45,.72);
    previous=tier.h;
  }

  // Street-level glazed foyer and legible approach, without using photographs.
  const entryW=30,front=stairFrontZ+.25;
  add('glass',centerX,baseY+.9,front,entryW,8.6,.3);
  add('stone',centerX-entryW/2-1.2,baseY,front+.1,1.8,10,.9);
  add('stone',centerX+entryW/2+1.2,baseY,front+.1,1.8,10,.9);
  add('roof',centerX,baseY+9.35,front+1.55,36,.65,5);
  for(let x=-12;x<=12;x+=3){
    add('mullion',centerX+x,baseY+.9,front+.23,.15,8.55,.28);
  }
  add('mullion',centerX,baseY+4.9,front+.24,entryW,.19,.33);
  add('mullion',centerX,baseY+8.65,front+.24,entryW,.24,.33);
  add('stone',centerX,baseY+.12,front+4,39,.22,6);
  for(let step=0;step<4;step++){
    add('steps',centerX,baseY-.03,front+4.3+step*1.18,39-step*.6,.17+step*.12,1.2);
  }

  const materials={
    glass:new THREE.MeshStandardMaterial({color:'#497f88',metalness:.27,roughness:.3,emissive:'#10272b',emissiveIntensity:.07}),
    mullion:new THREE.MeshStandardMaterial({color:'#71858a',metalness:.32,roughness:.47}),
    stone:new THREE.MeshStandardMaterial({color:'#c4c8bc',roughness:.82}),
    roof:new THREE.MeshStandardMaterial({color:'#aeb6ab',roughness:.78}),
    steps:new THREE.MeshStandardMaterial({color:'#a5a99e',roughness:.94})
  };
  for(const [kind,geometries] of Object.entries(batches)){
    if(!geometries.length)continue;
    const merged=mergeGeometries(geometries,false);
    geometries.forEach(g=>g.dispose());
    if(!merged)throw Error('Unable to merge '+kind+' facade geometry');
    const mesh=new THREE.Mesh(merged,materials[kind]);
    mesh.name='Library facade / '+kind;
    mesh.castShadow=kind==='stone'||kind==='roof';
    mesh.receiveShadow=true;
    group.add(mesh);
  }
  group.userData={
    modeledFrom:'photo-informed interpretive facade; no photograph or 3D scan embedded',
    sourceFootprint:'OSM building 263624481',
    estimated:true,
    maxHeightPolicy:'preserve existing sourced library body height'
  };
  return group;
}
