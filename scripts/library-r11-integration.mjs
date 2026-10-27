// The integration lane applies the emitted patch. This module also applies the
// identical edits in memory for candidate QA/builds; src/world.js is never written.
export function integrateLibraryWorld(source){
 let text=source;
 const replace=(before,after)=>{if(text.split(before).length!==2)throw Error('R11 world integration anchor changed: '+before.slice(0,100));text=text.replace(before,after);};
 for(const line of ["import {createLibraryFacade} from './library-facade.js';", "import {createLibraryClock} from './library-clock.js';", "import {createLibraryGreenRoofs} from './library-green-roofs.js';", "import {libraryMassingPlan} from './library-massing.js';"])
  replace(line+'\n','');
 replace("import * as THREE from 'three';", "import * as THREE from 'three';\nimport {createLibraryAsset} from './library-asset.js';");
 replace('this.buildingSilhouettes=createBuildingSilhouettes(this.data.buildings);','this.buildingSilhouettes=createBuildingSilhouettes(this.data.buildings,{includeLibrary:false});');
 // Consume the unchanged seeded colour RNG before skipping the old library.
 // Every unrelated building therefore retains precisely its existing colour.
 replace('let h=b.height;if(b.osmId===263624481)h=13;', 'if(b.osmId===263624481){this.dimensions.set(b.id,{height:b.height,bounds:bounds(b.points)});b.displayHeight=49.75;return;}\n   let h=b.height;');
 const begin=text.indexOf('   if(b.osmId===263624481){const plan=');
 const end=text.indexOf('   // The photographed central opening',begin);
 if(begin<0||end<begin)throw Error('R11 legacy library body block changed');text=text.slice(0,begin)+text.slice(end);
 const beginFacade=text.indexOf('   const lib=this.data.buildings.find(b=>b.osmId===263624481);if(lib){');
 const endFacade=text.indexOf('\n',beginFacade);
 if(beginFacade<0||endFacade<beginFacade)throw Error('R11 legacy library facade block changed');
 text=text.slice(0,beginFacade)+`   const lib=this.data.buildings.find(b=>b.osmId===263624481);if(lib){
    this.libraryAsset=createLibraryAsset({building:lib,baseY:BASE,buildingIndex:this.data.buildings.indexOf(lib),uniforms:{selection:this.selection,hover:this.hover,night:this.night},stage:this.libraryReviewStage||'material'});
    this.scene.add(this.libraryAsset);this.libraryMassing={source:'R11 unified asset',zones:this.libraryAsset.userData.plan.zones.map(z=>({id:z.id,levels:z.rows,height:z.top})),footprintUnchanged:true};
    this.libraryAsset.traverse(mesh=>{if(mesh.isMesh)this.pickables.push(mesh);});
    const bb=bounds(lib.points);this.libraryForecourt=createLibraryForecourt({centerX:(bb[0]+bb[2])/2,facadeFrontZ:bb[3],baseY:BASE});this.scene.add(this.libraryForecourt);
   }`+text.slice(endFacade);
 replace('return{place:hit.object.userData.place,index:-1};','return{place:hit.object.userData.place,index:hit.object.userData.buildingIndex??-1};');
 replace('setColors(mode){this.colorMode.value=', 'setColors(mode){this.libraryAsset?.setColorMode(mode);this.colorMode.value=');
 return text;
}
