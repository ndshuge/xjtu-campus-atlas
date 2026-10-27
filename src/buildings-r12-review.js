import * as THREE from 'three';
import {CampusWorld} from './world.js';
const views={
 'r12-main-front':{eye:[-31,54,-120],look:[-31,47,123],fov:52},
 'r12-main-front-clear':{eye:[-31,45,-45],mobileEye:[-31,95,-100],look:[-31,49,123],fov:58},
 'r12-main-near':{eye:[-31,37,32],look:[-31,53,123],fov:70},
 'r12-main-side':{eye:[185,90,130],look:[-31,42,130],fov:56},
 'r12-main-oblique':{eye:[-185,90,-20],look:[-31,42,126],fov:56},
 'r12-main-aerial':{eye:[-31,300,125],look:[-31,0,126],fov:55},
 'r12-campus-axis':{eye:[-110,180,-430],look:[-30,30,30],fov:56},
 'r12-science-front':{eye:[-130,47,-14],look:[75,14,-35],fov:54},
 'r12-science-entry':{eye:[0,14,-12.0355],mobileEye:[-28,16,-12.0355],look:[65,12,-12.0355],fov:64},
 'r12-science-oblique':{eye:[-85,70,120],look:[78,14,-45],fov:56},
 'r12-science-back':{eye:[100,58,-245],look:[78,12,-48],fov:55},
 'r12-science-aerial':{eye:[75,210,-48],look:[75,0,-47],fov:52},
 'r12-library-front':{eye:[-29,39,73],look:[-29,23,-108],fov:53},
 'r12-library-side':{eye:[190,145,-145],look:[-29,17,-145],fov:64},
 'r12-library-back':{eye:[-29,58,-385],look:[-29,17,-185],fov:52}
};
CampusWorld.prototype.buildingReviewStage=new URLSearchParams(location.search).get('stage')==='massing'?'massing':'material';
const originalHome=CampusWorld.prototype.home;
CampusWorld.prototype.home=function(...args){
 const result=originalHome.apply(this,args),pose=new URLSearchParams(location.search).get('inspection'),v=views[pose];
 window.__r12World=this;window.__libraryWorld=this;
 if(v){this.flyState=null;this.setAuto(false);this.camera.position.set(...(innerWidth<=768&&v.mobileEye?v.mobileEye:v.eye));this.controls.target.set(...v.look);this.camera.fov=innerWidth<=768?Math.max(78,v.fov):v.fov;this.camera.updateProjectionMatrix();this.controls.update();}
 return result;
};
function audit(w,ids,objects){
 const indices=ids.map(id=>w.data.buildings.findIndex(b=>b.osmId===id)),mats=new Set(),textures=new Set();let triangles=0,meshes=0,bytes=0,genericVertices=0;
 const g=w.buildingMesh.geometry;
 for(let i=0;i<g.attributes.buildingIndex.count;i++)if(indices.includes(Math.round(g.attributes.buildingIndex.getX(i))))genericVertices++;
 if(genericVertices){triangles+=genericVertices/3;meshes++;mats.add(w.buildingMesh.material);}
 for(const obj of objects.filter(Boolean))obj.traverse(m=>{if(!m.isMesh)return;meshes++;triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;for(const a of Object.values(m.geometry.attributes))bytes+=a.array.byteLength;mats.add(m.material);for(const t of Object.values(m.material))if(t?.isTexture)textures.add(t.uuid);});
 return {ids,indices,genericVertices,triangles,meshes,materials:mats.size,textures:textures.size,geometryBytes:bytes,owners:objects.filter(Boolean).map(o=>o.userData.owner||o.name),positions:ids.map(id=>{const b=w.data.buildings.find(x=>x.osmId===id);return {id,center:b.center,sourceHeight:b.height,displayHeight:b.displayHeight||b.height};})};
}
const diagnostics=CampusWorld.prototype.diagnostics;
CampusWorld.prototype.diagnostics=function(){
 const legacy=this.buildingSilhouettes?.children||[];
 return {...diagnostics.call(this),buildingAudit:{
  pose:new URLSearchParams(location.search).get('inspection'),stage:this.buildingReviewStage,
  main:audit(this,[263624057,263624058,263624059,263624060,263624061,264595812,3557330,3557331],this.mainComplexAsset?[this.mainComplexAsset]:[this.mainTowerFacade,this.mainERoofDetail,...legacy.filter(g=>g.userData.scope==='Main A-D only')]),
  science:audit(this,[263632364],this.scienceAsset?[this.scienceAsset]:[this.scienceHallFacade,...legacy.filter(g=>g.userData.osmId===263632364)]),
  library:audit(this,[263624481],[this.libraryAsset]),
  mainBounds:this.mainComplexAsset?new THREE.Box3().setFromObject(this.mainComplexAsset):null
 }};
};
await import('./app.js');
