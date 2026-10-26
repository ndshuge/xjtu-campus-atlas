import {CampusWorld} from './world.js';
import {pointIn,BASE} from './geo.js';

const originalLandmarks=CampusWorld.prototype.buildLandmarks;
CampusWorld.prototype.buildLandmarks=function(...args){
  const result=originalLandmarks.apply(this,args);
  // Production already installs the overlay once. The old review hook added
  // a second copy and produced false-positive visual evidence of dense windows.
  const world=this;
  window.__buildingReview={get overlay(){return world.buildingSilhouettes;},world,
   get cameraInsideBuildings(){return world.data.buildings.filter(b=>world.camera.position.y<BASE+b.height&&pointIn([world.camera.position.x,world.camera.position.z],b.points)&&!(b.holes||[]).some(h=>pointIn([world.camera.position.x,world.camera.position.z],h))).map(b=>b.name||b.id);}};
  return result;
};
const originalHome=CampusWorld.prototype.home;
CampusWorld.prototype.home=function(animate=true){
  const r=originalHome.call(this,animate);
  if(animate)return r;
  const focus=new URLSearchParams(window.location.search).get('building');
  if(focus)document.body.classList.add('photo-inspection');
  const views={
    library:{eye:[-27,31,108],look:[-29,22,-104]},
    libraryNorth:{eye:[-45,38,-321],look:[-30,8,-175]},
    main:{eye:[-25,57,346],look:[-29,30,132]},
    science:{eye:[-84,31,-34],look:[65,13,-33]},
    libraryFront:{eye:[-29,15,-271],look:[-29,8,-213],mobileEye:[-29,17,-277],mobileFov:78},
    libraryOblique:{eye:[-146,43,-314],look:[-29,9,-201],mobileEye:[-184,56,-361]},
    mainFront:{eye:[-31,60,-40],look:[-31,36,125],mobileEye:[-31,63,-55],mobileFov:74,desktopFov:42},
    mainOblique:{eye:[-188,88,314],look:[-31,31,127],mobileEye:[-238,118,380]},
    scienceFront:{eye:[-14,15,-12],look:[64,11,-12],mobileEye:[-45,19,-12]},
    scienceOblique:{eye:[-41,38,45],look:[72,12,-23],mobileEye:[-79,56,76]}
  };
  const view=views[focus];
  if(view){
    this.controls.maxPolarAngle=Math.PI*.55;
    this.camera.position.set(...(window.innerWidth<700&&view.mobileEye?view.mobileEye:view.eye));
    this.controls.target.set(...view.look);
    this.camera.fov=window.innerWidth<700?(view.mobileFov||70):(view.desktopFov||48);
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }
  return r;
};
await import('./app.js');
