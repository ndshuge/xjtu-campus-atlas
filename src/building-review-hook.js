import {CampusWorld} from './world.js';
import {createBuildingSilhouettes} from './building-silhouettes.js';

const originalLandmarks=CampusWorld.prototype.buildLandmarks;
CampusWorld.prototype.buildLandmarks=function(...args){
  const result=originalLandmarks.apply(this,args);
  const overlay=createBuildingSilhouettes(this.data.buildings);
  this.scene.add(overlay);
  window.__buildingReview={overlay,world:this};
  return result;
};
const originalHome=CampusWorld.prototype.home;
CampusWorld.prototype.home=function(animate=true){
  const r=originalHome.call(this,animate);
  if(animate)return r;
  const focus=new URLSearchParams(window.location.search).get('building');
  const views={
    library:{eye:[-27,31,108],look:[-29,22,-104]},
    libraryNorth:{eye:[-45,38,-321],look:[-30,8,-175]},
    main:{eye:[-25,57,346],look:[-29,30,132]},
    science:{eye:[-84,31,-34],look:[65,13,-33]}
  };
  const view=views[focus];
  if(view){
    this.controls.maxPolarAngle=Math.PI*.55;
    this.camera.position.set(...view.eye);
    this.controls.target.set(...view.look);
    this.camera.fov=window.innerWidth<700?60:48;
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }
  return r;
};
await import('./app.js');
