import {ownedArchitecture} from '../../building-asset-kit.js';

export const SIYUAN_ROOF_ID=263624056;

// Photo references show an open, pale rectangular rooftop monitor centered
// behind Siyuan's deep south eave (Commons 2010-04-02; XJTU News 2022).
// These sources do NOT establish its surveyed depth/height or 2026 condition.
export function createSiyuanRoofMonitorAsset({
 building,buildingIndex,baseY=1.1,uniforms={},stage='material'
}={}){
 if(building?.osmId!==SIYUAN_ROOF_ID)
  throw Error('Siyuan roof monitor requires OSM 263624056');
 const xs=building.points.map(p=>p[0]),zs=building.points.map(p=>p[1]);
 const cx=(Math.min(...xs)+Math.max(...xs))/2;
 const cz=(Math.min(...zs)+Math.max(...zs))/2-2.5;
 const height=building.height;
 const h=4.65, w=14.2, depth=5.2, pier=1.25;
 const base=height+.10;
 const kit=ownedArchitecture('Siyuan student activity centre / historical open rooftop monitor',{
  baseY,uniforms,stage
 });
 if(!kit.gray){
  kit.materials.stone.color.set('#c7c7bf');
  kit.materials.frame.color.set('#b5b7b2');
 }
 // One transparent centre opening, two pale piers, one pale lintel.
 // Historic depth and material shade are interpreted, not measured.
 for(const side of [-1,1]){
  kit.box('stone',cx+side*(w-pier)/2,base,cz,pier,h,depth,buildingIndex,height);
 }
 kit.box('stone',cx,base+h-.82,cz,w,.82,depth,buildingIndex,height);
 if(!kit.gray){
  // Narrow accents on both vertical edges, using the existing frame batch.
  for(const side of [-1,1]){
   kit.box('frame',cx+side*(w/2-.08),base+.10,cz+depth/2+.045,.16,h-.20,.11,buildingIndex,height);
  }
 }
 return kit.finish({
  owner:'siyuan-roof-monitor-asset.js',osmIds:[SIYUAN_ROOF_ID],
  sourceDataUnchanged:true,location:'centre of existing Siyuan flat roof',
  photoPeriod:'2010 and 2022 official/historical photo evidence',
  sourceCommons:'https://commons.wikimedia.org/wiki/File:Xi%27an_Jiaotong_University_2.jpg',
  sourceSchool:'https://news.xjtu.edu.cn/info/1021/187455.htm',
  photoCaptureDates:'2010-04-02 confirmed for Commons; XJTU News 2022 publication',
  photographLicense:'visual reference; no copied bitmap, no image texture',
  currentStateVerified:false,
  inferredDimensions:{width:w,height:h,depth},
  unknown:'2026 roof monitor survival, actual depth, material and precise roof alignment'
 });
}
