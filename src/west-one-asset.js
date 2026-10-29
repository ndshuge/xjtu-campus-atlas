import {ownedArchitecture} from './building-asset-kit.js';

export const WEST_ONE_ID = 263625085;
export const WEST_ONE_APPROX_HEIGHT = 21;

// Photo-guided exterior; the source OSM polygon and selectable building ID stay
// intact. The photograph shows a pale tiled facade and approximately six
// visible levels; height, individual wings and unphotographed faces are estimates.
export function createWestOneAsset({building,buildingIndex,baseY=1.1,uniforms={},stage='material'}={}){
 if(building?.osmId!==WEST_ONE_ID)throw new Error('West 1 requires its mapped building');
 const a=ownedArchitecture('West 1 / photo-guided exterior',{baseY,uniforms,stage});
 if(!a.gray){a.materials.stone.color.set('#d9d8d0');a.materials.glass.color.set('#71878b');a.materials.roof.color.set('#c2c3bd');a.materials.dark.color.set('#a9b1ad');}
 a.shell(building.points,{top:WEST_ONE_APPROX_HEIGHT,rows:6,index:buildingIndex,height:WEST_ONE_APPROX_HEIGHT,bayWidth:3.25});
 return a.finish({owner:'west-one-asset.js',osmIds:[WEST_ONE_ID],sourceDataUnchanged:true,
  evidence:'https://commons.wikimedia.org/wiki/File:XJTU_West_1_Office_Building.jpg',
  unknown:'2013 photograph; estimated height, roof, side/rear facades and current appearance'});
}
