import * as THREE from 'three';
import {BASE,ribbon} from './geo.js';
import {addCampusSpineGround} from './campus-road-ground.js';

// Verified street: XJTU's Wutong East Road was resurfaced in 2024 with asphalt,
// thermoplastic marks, wider permeable-concrete footpaths and newer luminaires.
// Dimensions beyond mapped road width are explicitly interpretive.
export function avenuePavingGeometry(roads){
  const road=roads.find(r=>r.name==='梧桐东道'&&r.campus);
  if(!road||road.points.length<2)return {sidewalks:[],edges:[],roadName:'梧桐东道',length:0};
  const points=road.points;
  const length=points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);
  const sidewalks=[],edges=[];
  for(const side of [-1,1]){
    const footpath=[],edge=[];
    for(let i=0;i<points.length;i++){
      const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)];
      let dx=next[0]-prev[0],dz=next[1]-prev[1],len=Math.hypot(dx,dz)||1;
      dx/=len;dz/=len;
      const normal=[-dz*side,dx*side],pt=points[i];
      const xOffset=road.width/2+1.47; // approx 2.4 m shoulder beyond asphalt
      footpath.push([pt[0]+normal[0]*xOffset,pt[1]+normal[1]*xOffset]);
      const e=road.width/2-.13;
      edge.push([pt[0]+normal[0]*e,pt[1]+normal[1]*e]);
    }
    // Keep footpaths below asphalt and road markings to avoid depth fighting.
    sidewalks.push(ribbon(footpath,2.22,BASE+.185));
    edges.push(ribbon(edge,.11,BASE+.195));
  }
  // The 2024 after-repair photograph shows a continuous YELLOW centre line.
  // Do not copy the generic dashed white road style onto this documented avenue.
  const centerline=ribbon(points,.13,BASE+.225);
  return {sidewalks,edges,centerline,roadName:road.name,length:Math.round(length),
    note:'2024 material types documented; shoulder widths and striping geometry interpretive'};
}

function porousConcreteTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const c=canvas.getContext('2d');c.fillStyle='#c8c8bd';c.fillRect(0,0,128,128);
  // Original aggregate/pore pattern. The documented 2024 surface is concrete,
  // not a grid of small paving bricks. This is not a photograph-derived map.
  let seed=1956;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<2100;i++){const v=150+Math.floor(random()*76);c.fillStyle=`rgba(${v},${v},${v-8},.32)`;c.fillRect(random()*128,random()*128,random()*1.4+.25,random()*1.4+.25);}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return texture;
}

export function addAvenuePaving(scene,roads){
  const data=avenuePavingGeometry(roads);
  const group=new THREE.Group();
  group.name='Wutong East Road / resurfaced asphalt and porous sidewalks (interpretive width)';
  const concrete=new THREE.MeshStandardMaterial({color:'#e1e1d8',map:porousConcreteTexture(),roughness:.98});
  const line=new THREE.MeshBasicMaterial({color:'#d2cfb5',transparent:true,opacity:.86,depthWrite:false});
  for(const [index,collection,material] of [[0,data.sidewalks,concrete],[1,data.edges,line]]){
    for(const geometry of collection){
      if(!geometry)continue;
      const mesh=new THREE.Mesh(geometry,material);
      mesh.name=index?'subtle roadway edge thermoplastic':'permeable concrete walkway (schematic width)';
      mesh.receiveShadow=true;group.add(mesh);
    }
  }
  if(data.centerline){
    const paint=new THREE.MeshBasicMaterial({color:'#cfb548',depthWrite:false});
    const center=new THREE.Mesh(data.centerline,paint);center.name='2024 documented continuous yellow centre line';center.renderOrder=7;group.add(center);
  }
  group.userData={source:'https://news.xjtu.edu.cn/info/1002/214178.htm',
    published:'2024-09-20',name:data.roadName,length:data.length,
    status:'photo-grounded material class / unmeasured pavement geometry'};
  scene.add(group);
  // Enhance only mapped road corridors without editing shared world.js.
  group.userData.mainRoadGround=addCampusSpineGround(scene,roads).userData;
  return group;
}
