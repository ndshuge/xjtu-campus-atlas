import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {boxGeometry} from './geo.js';

/**
 * Interpreted architectural detailing of XJTU Main Building E.
 * Matches the existing OSM footprint and estimated height; not a survey/BIM.
 * Independent facade surfaces preserve the selectable OSM building mesh.
 */
export function createMainTowerFacade({footprint,height,baseY}){
  const [x0,z0,x1,z1]=footprint;
  const cx=(x0+x1)/2,cz=(z0+z1)/2,w=x1-x0,d=z1-z0;
  if(!(w>12&&d>12&&height>20))throw Error('Unexpected main tower dimensions');
  const group=new THREE.Group();
  group.name='XJTU main E — interpreted architectural details';
  const parts={stone:[],glass:[],frame:[],shade:[]};
  const add=(kind,x,y,z,a,b,c)=>{
    if([x,y,z,a,b,c].some(n=>!Number.isFinite(n))||a<=0||b<=0||c<=0)throw Error('Invalid main tower facade part');
    parts[kind].push(boxGeometry(x,y,z,a,b,c));
  };
  // Distinctive tall blue-glass center and pale stone piers, seen in campus photos.
  // Both faces are decorated: the captured facade orientation is not surveyed.
  const glazedW=Math.min(21,w*.6),glassStart=baseY+10,glassTop=baseY+height-11;
  for(const face of [-1,1]){
    const z=face>0?z1+.09:z0-.09;
    const gf=z+face*.10,outline=z+face*.29;
    add('glass',cx,glassStart,gf,glazedW,glassTop-glassStart,.28);
    for(let i=0;i<=6;i++){
      const x=cx-glazedW/2+glazedW*i/6;
      add('frame',x,glassStart,outline,.19,glassTop-glassStart,.36);
    }
    for(let y=glassStart+3.7;y<glassTop-.5;y+=3.7)
      add('frame',cx,y,outline,glazedW,.18,.36);
    const pierOffset=glazedW/2+1.2;
    for(const side of [-1,1])
      add('stone',cx+side*pierOffset,baseY+8,z+face*.22,1.35,height-10,.85);
    // Entrance vestibule and restrained canopy.
    add('glass',cx,baseY+1.2,z+face*.35,Math.min(17,glazedW),7,.34);
    add('frame',cx,baseY+7.9,z+face*.6,Math.min(19,glazedW+2),.45,1.5);
    for(let i=-2;i<=2;i++)
      add('frame',cx+i*3,baseY+1.1,z+face*.64,.15,6.8,.36);
    // Upper framed visual opening. Backed by dark glass to avoid making an
    // unsupported claim that an actual void/transparent passage is modeled.
    const portalBase=baseY+height-15;
    add('shade',cx,portalBase,z+face*.12,glazedW*.78,11.5,.35);
    add('stone',cx,baseY+height-3.2,z+face*.38,glazedW*.9,1.3,1.25);
    for(const side of [-1,1])
      add('stone',cx+side*glazedW*.45,portalBase,z+face*.38,1.35,12.8,1.4);
  }
  // Side facade bands provide depth in the orbital camera (not only front decals).
  const facadeSideWidth=d*.72;
  for(const side of [-1,1]){
    const x=side>0?x1+.09:x0-.09;
    for(let i=0;i<5;i++){
      const z=cz-facadeSideWidth/2+(i+.5)*facadeSideWidth/5;
      add('glass',x,baseY+13,z,.21,height-23,facadeSideWidth/7.5);
      add('frame',x+side*.23,baseY+13,z,.32,height-23,.12);
    }
  }

  const mats={
    stone:new THREE.MeshStandardMaterial({color:'#c4c6b8',roughness:.85}),
    glass:new THREE.MeshStandardMaterial({color:'#3d727b',roughness:.23,metalness:.3,emissive:'#10282d',emissiveIntensity:.09}),
    frame:new THREE.MeshStandardMaterial({color:'#778b87',roughness:.48,metalness:.22}),
    shade:new THREE.MeshStandardMaterial({color:'#243e47',roughness:.7,metalness:.04})
  };
  for(const [kind,geos] of Object.entries(parts)){
    if(!geos.length)continue;
    const geo=mergeGeometries(geos,false);
    geos.forEach(g=>g.dispose());
    if(!geo)throw Error('Unable to batch main tower geometry');
    const mesh=new THREE.Mesh(geo,mats[kind]);
    mesh.name='Main building E / '+kind;
    mesh.castShadow=kind==='stone';
    mesh.receiveShadow=true;
    group.add(mesh);
  }
  group.userData={
    sourceFootprint:'OpenStreetMap building 263624057',
    heightPolicy:'existing estimated height, no new measurement',
    accurateSurvey:false,
    designIntent:'photo-informed approximated facade'
  };
  return group;
}
