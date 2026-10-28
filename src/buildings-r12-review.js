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
 'r13-siyuan-front':{eye:[-30,18,450],look:[-30,10,360],fov:58,mobileFov:102},
 'r13-siyuan-entry':{eye:[-30,11,413],look:[-30,10,372],fov:67,mobileFov:98},
 'r13-siyuan-oblique':{eye:[-150,60,470],look:[-30,10,334],fov:55,mobileFov:90},
 'r13-siyuan-aerial':{eye:[-30,230,334],look:[-30,0,334],fov:55,mobileFov:90},
 'r13-museum-front':{eye:[-44,18,393],look:[44,8,393],fov:58,mobileFov:95},
 // Review-only camera: stand in the courtyard between Siyuan and the museum,
 // avoiding the existing front view's trees and neighbouring building. This
 // preserves the scene and does not assert a surveyed entrance orientation.
 'r14-museum-face':{eye:[30,7,381],mobileEye:[29,7,381],look:[35,8,381],fov:92,mobileFov:115,minDistance:2},
 'r14-museum-entry':{eye:[30,5,411],mobileEye:[29,5,411],look:[35,5,411],fov:88,mobileFov:110,minDistance:2},
 'r14-museum-oblique':{eye:[17,25,440],mobileEye:[12,28,445],look:[40,8,393],fov:72,mobileFov:105},
 'r13-museum-oblique':{eye:[-62,45,479],look:[44,8,393],fov:55,mobileFov:90},
 'r13-museum-back':{eye:[132,30,393],look:[44,8,393],fov:58,mobileFov:90},
 'r13-museum-aerial':{eye:[44,180,393],look:[44,0,393],fov:55,mobileFov:90},
 'r13-central-front':{eye:[-29,20,-545],look:[-29,9,-468],fov:58,mobileFov:100},
 'r13-central-oblique':{eye:[-170,65,-575],look:[-29,9,-460],fov:55,mobileFov:90},
 'r13-central-back':{eye:[-29,45,-338],look:[-29,10,-457],fov:55,mobileFov:90},
 'r13-central-aerial':{eye:[-29,245,-455],look:[-29,0,-455],fov:55,mobileFov:90},
 'r12-science-front':{eye:[-130,47,-14],look:[75,14,-35],fov:54},
 'r12-science-entry':{eye:[0,14,-12.0355],mobileEye:[-28,16,-12.0355],look:[65,12,-12.0355],fov:64},
 'r12-science-oblique':{eye:[-85,70,120],look:[78,14,-45],fov:56},
 'r12-science-back':{eye:[100,58,-245],look:[78,12,-48],fov:55},
 'r12-science-aerial':{eye:[75,210,-48],look:[75,0,-47],fov:52},
 'r12-library-near':{eye:[-29,14,-42],look:[-29,15,-94],fov:70},
 'r12-library-front':{eye:[-29,39,73],look:[-29,23,-108],fov:53},
 'r12-library-side':{eye:[190,145,-145],look:[-29,17,-145],fov:64},
 'r12-library-back':{eye:[-29,58,-385],look:[-29,17,-185],fov:52}
};
CampusWorld.prototype.buildingReviewStage=new URLSearchParams(location.search).get('stage')==='massing'?'massing':'material';
const originalHome=CampusWorld.prototype.home;
CampusWorld.prototype.home=function(...args){
 const result=originalHome.apply(this,args),pose=new URLSearchParams(location.search).get('inspection'),v=views[pose];
 window.__r12World=this;window.__libraryWorld=this;
 if(v){this.flyState=null;this.setAuto(false);if(v.minDistance)this.controls.minDistance=v.minDistance;this.camera.position.set(...(innerWidth<=768&&v.mobileEye?v.mobileEye:v.eye));this.controls.target.set(...v.look);this.camera.fov=innerWidth<=768?(v.mobileFov||Math.max(78,v.fov)):v.fov;this.camera.updateProjectionMatrix();this.controls.update();}
 return result;
};
function audit(w,ids,objects){
 const indices=ids.map(id=>w.data.buildings.findIndex(b=>b.osmId===id)),mats=new Set(),textures=new Set();let triangles=0,meshes=0,bytes=0,genericVertices=0,activeTriangles=0,activeMeshes=0;
 const g=w.buildingMesh.geometry;
 for(let i=0;i<g.attributes.buildingIndex.count;i++)if(indices.includes(Math.round(g.attributes.buildingIndex.getX(i))))genericVertices++;
 if(genericVertices){triangles+=genericVertices/3;activeTriangles+=genericVertices/3;meshes++;activeMeshes++;mats.add(w.buildingMesh.material);}
 for(const obj of objects.filter(Boolean))obj.traverse(m=>{if(!m.isMesh)return;meshes++;const count=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;triangles+=count;let visible=m.visible;for(let p=m.parent;p;p=p.parent)visible=visible&&p.visible;if(visible){activeTriangles+=Math.min(count,m.geometry.drawRange.count/3);activeMeshes++;}for(const a of Object.values(m.geometry.attributes))bytes+=a.array.byteLength;mats.add(m.material);for(const t of Object.values(m.material))if(t?.isTexture)textures.add(t.uuid);});
 return {ids,indices,genericVertices,triangles,meshes,activeTriangles,activeMeshes,detailLOD:objects.find(o=>o?.userData.detailLOD)?.userData.detailLOD||null,materials:mats.size,textures:textures.size,geometryBytes:bytes,owners:objects.filter(Boolean).map(o=>o.userData.owner||o.name),positions:ids.map(id=>{const b=w.data.buildings.find(x=>x.osmId===id);return {id,center:b.center,sourceHeight:b.height,displayHeight:b.displayHeight||b.height};})};
}
const diagnostics=CampusWorld.prototype.diagnostics;
CampusWorld.prototype.diagnostics=function(){
 const legacy=this.buildingSilhouettes?.children||[];
 return {...diagnostics.call(this),buildingAudit:{
  pose:new URLSearchParams(location.search).get('inspection'),stage:this.buildingReviewStage,
  main:audit(this,[263624057,263624058,263624059,263624060,263624061,264595812,3557330,3557331],this.mainComplexAsset?[this.mainComplexAsset]:[this.mainTowerFacade,this.mainERoofDetail,...legacy.filter(g=>g.userData.scope==='Main A-D only')]),
  siyuan:audit(this,[263624056],this.siyuanAsset?[this.siyuanAsset]:[this.siyuanCenterFacade]),
  museum:audit(this,[1167525875],this.museumAsset?[this.museumAsset]:[]),
  central:audit(this,[263625087,263625088,263625089],this.centralBuildingAsset?[this.centralBuildingAsset]:[]),
  science:audit(this,[263632364],this.scienceAsset?[this.scienceAsset]:[this.scienceHallFacade,...legacy.filter(g=>g.userData.osmId===263632364)]),
  library:audit(this,[263624481],[this.libraryAsset]),
  mainBounds:this.mainComplexAsset?new THREE.Box3().setFromObject(this.mainComplexAsset):null
 }};
};
await import('./app.js');
