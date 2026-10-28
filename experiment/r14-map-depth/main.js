import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import * as THREE from 'three';
import './style.css';
maplibregl.setWorkerUrl(workerUrl);

// The real WGS84 campus location/OSM outlines provide context. The wall and
// sphere are deliberately synthetic test geometry, not architectural claims.
const center = [108.9792, 34.24625];
const sphereCenter = [108.9792, 34.2464];
const mode = new URLSearchParams(location.search).get('mode') === 'separate' ? 'separate' : 'shared';
document.querySelector('#mode').textContent = mode === 'shared' ? '单画布共享深度' : '双画布，不共享深度';
const wall = {type:'FeatureCollection',features:[{type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[[
  [108.97878,34.24605],[108.97962,34.24605],[108.97962,34.24610],[108.97878,34.24610],[108.97878,34.24605]
]]}}]};
const response = await fetch('/data/osm-source.json');
if (!response.ok) throw new Error('Campus OSM data could not be loaded');
const osm = await response.json();
const buildings = {type:'FeatureCollection',features:osm.elements.filter(e=>e.type==='way'&&e.tags?.building&&e.geometry?.length>=4).map(e=>({type:'Feature',properties:{id:e.id,name:e.tags.name||''},geometry:{type:'Polygon',coordinates:[e.geometry.map(p=>[p.lon,p.lat])]}}))};
const map = new maplibregl.Map({container:'map',center,zoom:17.8,pitch:57,bearing:0,attributionControl:false,canvasContextAttributes:{antialias:true},style:{version:8,sources:{buildings:{type:'geojson',data:buildings},wall:{type:'geojson',data:wall}},layers:[{id:'background',type:'background',paint:{'background-color':'#dde8d6'}},{id:'osm',type:'fill',source:'buildings',paint:{'fill-color':'#c4c7bc','fill-outline-color':'#9a9e91'}},{id:'wall',type:'fill-extrusion',source:'wall',paint:{'fill-extrusion-color':'#336f9d','fill-extrusion-height':70,'fill-extrusion-opacity':1}}]}});
let renderCount=0, errors=[];
window.addEventListener('error',event=>errors.push(event.message));
map.on('error',event=>errors.push(event.error?.message||String(event.error)));
const model = maplibregl.MercatorCoordinate.fromLngLat(sphereCenter,0);
const scale=model.meterInMercatorCoordinateUnits();
const modelMatrix=new THREE.Matrix4().makeTranslation(model.x,model.y,model.z).scale(new THREE.Vector3(scale,scale,scale));
const layer={id:'test-sphere',type:'custom',renderingMode:'3d',
  onAdd(map,gl){
    this.camera=new THREE.Camera();this.scene=new THREE.Scene();
    this.sphere=new THREE.Mesh(new THREE.SphereGeometry(30,40,24),new THREE.MeshBasicMaterial({color:0xe23624}));
    this.sphere.position.z=30;this.scene.add(this.sphere);
    if(mode==='shared'){
      this.renderer=new THREE.WebGLRenderer({canvas:map.getCanvas(),context:gl});this.renderer.autoClear=false;
    }else{
      const canvas=document.createElement('canvas');canvas.id='overlay';map.getContainer().appendChild(canvas);
      this.renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});this.renderer.setClearColor(0,0);this.renderer.setPixelRatio(devicePixelRatio);
    }
    const dbg=gl.getExtension('WEBGL_debug_renderer_info');
    window.r14Depth={mode,sharedContext:mode==='shared'&&this.renderer.getContext()===gl,mapContext:gl.constructor.name,threeContext:this.renderer.getContext().constructor.name,gpu:dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):'unavailable',errors,get renderCount(){return renderCount},threeRevision:THREE.REVISION,maplibreVersion:maplibregl.getVersion()};
  },
  render(gl,args){
    if(mode==='separate')this.renderer.setSize(map.getCanvas().clientWidth,map.getCanvas().clientHeight,false);
    this.camera.projectionMatrix.fromArray(args.defaultProjectionData.mainMatrix).multiply(modelMatrix);
    this.renderer.resetState();this.renderer.render(this.scene,this.camera);renderCount++;
    window.r14Depth.projectedCenter=new THREE.Vector3(0,0,30).applyMatrix4(this.camera.projectionMatrix).toArray();
    window.r14Depth.draws=this.renderer.info.render.calls;
  },
  onRemove(){this.sphere.geometry.dispose();this.sphere.material.dispose();this.renderer.dispose();if(mode==='separate')document.querySelector('#overlay')?.remove();}
};
map.on('load',()=>{map.addLayer(layer);map.triggerRepaint();});
window.r14Map=map;
