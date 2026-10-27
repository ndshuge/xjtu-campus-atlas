import * as THREE from 'three';
import {CampusWorld} from './world.js';

// Identical absolute metre-space cameras for baseline, gray and material runs.
const views={
 'r11-north-front':{eye:[-29,58,-385],look:[-29,17,-185],fov:52},
 'r11-north-detail':{eye:[-29,20,-274],look:[-29,10,-212],fov:66},
 'r11-south-front':{eye:[-29,39,73],look:[-29,23,-108],fov:53},
 'r11-east':{eye:[190,145,-145],look:[-29,17,-145],fov:64},
 'r11-occlusion':{eye:[166,67,-145],look:[-29,20,-145],fov:64},
 'r11-oblique':{eye:[-190,91,14],look:[-29,22,-140],fov:63},
 'r11-oblique-wide':{eye:[-240,115,65],look:[-29,22,-147],fov:63},
 'r11-aerial':{eye:[-29,260,-146],look:[-29,0,-145],fov:57},
 'r11-context':{eye:[-165,82,-350],look:[-29,20,-175],fov:57}
};
CampusWorld.prototype.libraryReviewStage=new URLSearchParams(location.search).get('stage')==='massing'?'massing':'material';
const originalHome=CampusWorld.prototype.home;
CampusWorld.prototype.home=function(...args){
 const result=originalHome.apply(this,args),pose=new URLSearchParams(location.search).get('inspection'),view=views[pose];
 window.__libraryWorld=this;
 if(view){this.flyState=null;this.setAuto(false);this.camera.position.set(...view.eye);this.controls.target.set(...view.look);this.camera.fov=innerWidth<700?Math.max(view.fov,78):view.fov;this.camera.updateProjectionMatrix();this.controls.update();}
 const lib=this.data.buildings.find(b=>b.osmId===263624481),index=this.data.buildings.indexOf(lib);
 window.libraryR11Audit=()=>{
  const counts={},materials=new Set(),textures=new Set();let triangles=0,bytes=0,genericVertices=0;
  const ids=this.buildingMesh.geometry.attributes.buildingIndex;
  for(let i=0;i<ids.count;i++)if(Math.round(ids.getX(i))===index)genericVertices++;
  const objects=this.libraryAsset?[this.libraryAsset]:[this.libraryFacade,this.libraryClock,this.libraryGreenRoofs,...this.buildingSilhouettes.children.filter(g=>g.userData.osmId===263624481)];
  for(const object of objects.filter(Boolean))object.traverse(m=>{if(!m.isMesh)return;counts[m.userData.libraryOwner||'legacy']=(counts[m.userData.libraryOwner||'legacy']||0)+1;triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;for(const a of Object.values(m.geometry.attributes))bytes+=a.array.byteLength;
   materials.add(m.material.uuid);for(const v of Object.values(m.material))if(v?.isTexture)textures.add(v.uuid);
  });
  const pickable=this.libraryAsset?.children.find(m=>m.isMesh);
  return {variant:this.libraryAsset?'R11':'baseline',stage:this.libraryReviewStage,pose,genericVertices,owners:counts,triangles,geometryBytes:bytes,materials:materials.size,textures:textures.size,
   dataIdentity:{id:lib.id,index,pointCount:lib.points.length,height:lib.height},pickableMeshCount:this.pickables.filter(m=>m.userData.place===lib).length,
   hitInterface:pickable?{id:this.hitPlace({object:pickable}).place?.id,index:this.hitPlace({object:pickable}).index}:null,
   collisionInside:this.blocked([-29,-210]),collisionCourtyard:this.blocked([-64,-185]),
   bounds:this.libraryAsset?new THREE.Box3().setFromObject(this.libraryAsset):null,shadowEnabled:this.renderer.shadowMap.enabled};
 };
 return result;
};
const originalDiagnostics=CampusWorld.prototype.diagnostics;
CampusWorld.prototype.diagnostics=function(){return {...originalDiagnostics.call(this),libraryAudit:window.libraryR11Audit?.()};};
await import('./app.js');
