import * as THREE from 'three';
import {ownedArchitecture} from '../../building-asset-kit.js';

// These five OSM-specific review meshes are NOT photographs, survey-grade
// architecture or production-ready replacements. As-built facades are unknown.
// Preserve the current generic buildings until independently approved.
export const NORTH_FIVE_SPECS=Object.freeze([
 {osmId:263808688,displayName:'Zhongying East21',key:'zhongying-east21',sourceUrl:'https://cy.xjtu.edu.cn/gyzy/lxwm.htm',
  evidence:'official college page identifies East21 office and four-building quadrangle; no wing-by-wing facade photograph',tone:'#cdc9bf',trim:'#9e998f',glass:'#52636a',rows:8,bay:3.2},
 {osmId:264106099,displayName:'Lizhi East26',key:'lizhi-east26',sourceUrl:'https://news.xjtu.edu.cn/info/1219/200022.htm',
  evidence:'school maintenance report confirms former young-teacher apartment converted to East26 in 2023; exterior unverified',tone:'#c5c2b6',trim:'#8c8e87',glass:'#4f6268',rows:7,bay:3.35},
 {osmId:264107453,displayName:'East11',key:'east11',sourceUrl:'https://cgb.xjtu.edu.cn/site/caseInfo?jdid=4af592f37641715c0176419ae14f000d&mkid=4af592f37641715c01764186a7f20002&nrid=4af592f38968b80c018b6a136cff00f4',
  evidence:'university procurement mentions balcony safety enclosure; completion and present appearance not verified',tone:'#c8c8c0',trim:'#979b99',glass:'#526672',rows:7,bay:3.55},
 {osmId:264107444,displayName:'East14',key:'east14',sourceUrl:'https://cgb.xjtu.edu.cn/site/caseInfo?jdid=4af592f37641715c0176419ae14f000d&mkid=4af592f37641715c01764186a7f20002&nrid=4af592f38968b80c018b6a136cff00f4',
  evidence:'university procurement mentions balcony safety enclosure; completion and present appearance not verified',tone:'#d0cac0',trim:'#9b948d',glass:'#556871',rows:7,bay:3.5},
 {osmId:264106088,displayName:'West1 dorm',key:'west1-dorm',sourceUrl:'https://info.xjtu.edu.cn/info/1045/46436.htm',
  evidence:'2026 West No.1 dorm restoration purchasing notice, which is not as-built evidence; distinct from teaching West1 way/263625085',tone:'#c2c1b8',trim:'#909490',glass:'#536871',rows:7,bay:3.3}
].map(s=>Object.freeze({...s,currentFacadeVerified:false,productionReady:false})));

const byId=new Map(NORTH_FIVE_SPECS.map(s=>[s.osmId,s]));
export function createNorthFiveReviewAsset({building,buildingIndex,baseY=1.1,stage='material',uniforms={}}={}){
 const spec=byId.get(building?.osmId);
 if(!spec)throw Error('Building not in five-building review scope');
 if(!Number.isInteger(buildingIndex)||buildingIndex<0)throw Error('Invalid buildingIndex');
 if(!Array.isArray(building.points)||building.points.length<4||
  building.points.some(p=>!Array.isArray(p)||p.length<2||!p.every(Number.isFinite)))throw Error('Invalid OSM polygon');
 if(!Number.isFinite(building.height)||building.height<4)throw Error('Invalid OSM height');
 if(building.center?.[1]<0)throw Error('Wrong Z partition');
 const top=building.height;
 const b=ownedArchitecture(spec.displayName+' / evidence-limited schematic review',{baseY,stage,uniforms,
  stoneTileScale:spec.key==='zhongying-east21'?1.1:.8,
  extraMaterials:{detail:new THREE.MeshStandardMaterial({color:spec.trim,roughness:.72})}
 });
 if(!b.gray){
  b.materials.stone.color.set(spec.tone);
  b.materials.frame.color.set(spec.trim);
  b.materials.glass.color.set(spec.glass);
  b.materials.roof.color.set('#969991');
  b.materials.dark.color.set('#464e50');
 }
 // The complete enclosure is generated from each OSM footprint: unlike a
 // made-up rectangular tower, its true polygon outline remains the boundary.
 // Floor/window rhythms are visualization placeholders; not observed facts.
 const {edges}=b.shell(building.points,{top,rows:spec.rows,index:buildingIndex,height:top});
 if(!b.gray){
  for(const edge of edges){
   if(edge.length<1.5)continue;
   // Modest roof lip and ground course differentiate polygon geometry at
   // driving distances, without implying observed balconies or air-conditioners.
   b.plane('detail',edge,0,edge.length,top-.32,top-.12,buildingIndex,top,.055);
   b.plane('frame',edge,0,edge.length,.24,.44,buildingIndex,top,.06);
  }
 }
 return b.finish({
  owner:'north-five-review-assets.js',key:spec.key,osmId:spec.osmId,
  buildingName:spec.displayName,sourceUrl:spec.sourceUrl,evidence:spec.evidence,
  mode:'standalone-review-only',reviewOnly:true,productionReady:false,
  hostOriginalMustRemain:true,currentFacadeVerified:false,
  noVerifiedExteriorPhoto:true,sourceDataUnchanged:true,
  floorCountEstimated:true,windowLayoutEstimated:true,
  roofLayoutEstimated:true,entranceBearingVerified:false,
  suggestedIntegration:'Do not include in production or suppress the generic mass until exterior evidence is approved',
  geometryBasis:'OSM polygon and estimated campus height; schematic, reversible roof/lower wall articulation'
 });
}
