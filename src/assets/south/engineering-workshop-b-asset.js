import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';
import {planCells,cellBoundary} from '../../library-asset-plan.js';

export const ENGINEERING_WORKSHOP_B_ID=264420412;
export const ENGINEERING_WORKSHOP_A_ID=263633887;
export const WORKSHOP_B_OFFICIAL_MAP='https://vi.xjtu.edu.cn/qt/jddt.htm';
export const WORKSHOP_B_HISTORICAL='https://news.xjtu.edu.cn/info/1033/13780.htm';
export const WORKSHOP_B_HISTORIC_PHOTO='https://jwc.nepu.edu.cn/__local/3/12/F8/E78F5F9D63A87136B8DC3A2328C_BE6E0AFC_2A8400.pdf';
export const WORKSHOP_B_EAST_DOOR='https://oa.xjtu.edu.cn/zxgg_infonew.jsp?processInsId=SRWVQPZ';

function signTexture(){
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');
 canvas.width=1024;canvas.height=256;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#666d69';ctx.fillRect(0,0,1024,256);
 ctx.fillStyle='#f1eee3';ctx.font='bold 132px "Microsoft YaHei",sans-serif';
 ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.fillText('\u5de5\u7a0b\u574a  B\u533a',512,129,920);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
 return tex;
}

export function createEngineeringWorkshopBAsset({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 if(building?.osmId!==ENGINEERING_WORKSHOP_B_ID)throw Error('Expected old Engineering Workshop B OSM 264420412, not A');
 if(!Number.isInteger(buildingIndex)||buildingIndex<0)throw Error('Missing Workshop B OSM index');
 const index=buildingIndex,h=building.height;
 const cells=planCells(building.points),edges=cellBoundary(cells);
 // The 2025 event notice names the EAST DOOR, but no survey identifies the
 // exact eastern facade segment. Pick one for isolated review, not publication.
 const face=edges.filter(e=>e.nx>.8 && e.length>13)
  .sort((a,b)=>(a.a[1]+a.b[1])-(b.a[1]+b.b[1]))[0];
 if(!face)throw Error('Workshop B candidate east-facing OSM wall missing');
 const L=face.length,c=L*.5,entryWidth=Math.min(4.4,L*.32);
 const b=ownedArchitecture('Old Engineering Workshop B — evidence-limited entrance', {
  baseY,uniforms,stage,stoneTileScale:1.1,
  extraMaterials:{
   darkEntry:new THREE.MeshStandardMaterial({color:'#424843',roughness:.83,side:THREE.DoubleSide}),
   signBackground:new THREE.MeshStandardMaterial({color:'#777b74',roughness:.88,side:THREE.DoubleSide}),
   signFrame:new THREE.MeshStandardMaterial({color:'#a5a9a1',roughness:.68})
  }
 });
 if(!b.gray){
  b.materials.stone.color.set('#898c85');b.materials.roof.color.set('#8c918b');
  b.materials.darkEntry.color.set('#515b55');b.materials.signBackground.color.set('#707772');
 }
 for(const e of edges)b.plane('stone',e,0,e.length,0,h,index,h);
 b.roof(cells,h,index,h);
 // PHOTO/NOTICE-CONSTRAINED: older slide shows "工程坊 B区" entrance sign,
 // and 2025 campus notice specifies an EAST door. Opening dimensions, type,
 // position and wall material are unmeasured placeholders.
 b.plane('darkEntry',face,c-entryWidth*.5,c+entryWidth*.5,.04,2.88,index,h,.065);
 b.plane('signBackground',face,c-3,c+3,3.09,4.17,index,h,.13);
 b.plane('signFrame',face,c-3.04,c+3.04,4.13,4.22,index,h,.165);
 const frontCenter=[face.a[0]+face.ux*c+face.nx*.20,baseY+3.55,face.a[1]+face.uz*c+face.nz*.20];
 const model=b.finish({
  owner:'src/assets/south/engineering-workshop-b-asset.js',
  osmIds:[ENGINEERING_WORKSHOP_B_ID],campusMapRegion:'B',
  officialMapSource:WORKSHOP_B_OFFICIAL_MAP,
  historySource:WORKSHOP_B_HISTORICAL,photoReference:WORKSHOP_B_HISTORIC_PHOTO,
  eastEntranceSource:WORKSHOP_B_EAST_DOOR,
  photoScope:'historical-B-zone-entrance-sign-only',
  fullFacadeStatus:'UNVERIFIED',surveyedHeight:false,heightStatus:'unmeasured-osm-estimate',
  entranceOrientationStatus:'east-side-candidate-not-surveyed',roofStatus:'unknown-flat-placeholder',
  confirmedFeatures:['B-zone-entrance-sign','old-factory-courtyard-layout','east-side-public-entrance'],
  inferredFeatures:['which-east-wall','entry-width-and-height','door-material','roof-slope','window-count'],
  explicitlyExcluded:['Workshop-A-glass-band-facade','2020-student-redesign-render'],
  photoDate:'historical-slide-circa-2014',photographLicense:'reference-only',
  confidence:'identity-high/facade-low',
  front:{center:frontCenter,normal:[face.nx,face.nz],tangent:[face.ux,face.uz]}
 });
 const tex=stage==='massing'?null:signTexture();
 if(tex){
  const g=new THREE.PlaneGeometry(Math.min(5.8,L*.72),.87);
  const mat=new THREE.MeshBasicMaterial({map:tex,depthWrite:false,side:THREE.DoubleSide});
  const sign=new THREE.Mesh(g,mat);
  sign.name='Engineering Workshop B — evidence-limited historical sign';
  sign.position.set(...frontCenter);
  sign.rotation.y=Math.atan2(face.nx,face.nz);
  g.setAttribute('buildingIndex',new THREE.Float32BufferAttribute(Array(g.attributes.position.count).fill(index),1));
  sign.userData.buildingAssetMesh=true;sign.userData.owner='src/assets/south/engineering-workshop-b-asset.js';
  model.add(sign);
  const oldDispose=model.dispose;model.dispose=()=>{oldDispose();tex.dispose();};
 }
 return model;
}
