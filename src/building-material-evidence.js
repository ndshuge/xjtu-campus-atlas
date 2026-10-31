// R17: evidence-backed, explicit facade profiles. Unknown buildings keep R16 fallback.
const profiles=new Map([
 [263624481,Object.freeze({
  osmId:263624481,
  families:Object.freeze({wall:'stone',glass:'tinted-glass',roof:'green-roof'}),
  wallColor:'#c3bdb3',glassColor:'#344c58',roughness:.84,
  roof:'tiered with green sections',confidence:'photo-estimated',
  sourceUri:'https://commons.wikimedia.org/wiki/File:%E8%A5%BF%E5%AE%89%E4%BA%A4%E9%80%9A%E5%A4%A7%E5%AD%A6_%E9%92%B1%E5%AD%A6%E6%A3%AE%E5%9B%BE%E4%B9%A6%E9%A6%86%E5%92%8C%E5%9B%9B%E5%A4%A7%E5%8F%91%E6%98%8E%E5%B9%BF%E5%9C%BA.jpg',
  license:'CC BY-SA 4.0'
 })],
 [263624057,Object.freeze({
  osmId:263624057,families:Object.freeze({wall:'stone',glass:'glazed-inset',roof:'stone-crown'}),
  wallColor:'#c8c0b3',glassColor:'#344e60',roughness:.84,roof:'crowned main tower',
  confidence:'photo-estimated',sourceUri:'https://wmw.xjtu.edu.cn/wh/dbcg1.htm',
  license:'university-photo-reference-only'
 })],
 [263632364,Object.freeze({
  osmId:263632364,families:Object.freeze({wall:'warm-masonry',glass:'blue-glass',roof:'pitched-annex'}),
  wallColor:'#bd9e79',glassColor:'#2c7d9e',roughness:.84,roof:'low pitched annex with entry glazing',
  confidence:'photo-estimated',sourceUri:'https://wmw.xjtu.edu.cn/wh/dbcg1/2.htm',
  license:'university-photo-reference-only'
 })],
 [263624056,Object.freeze({
  osmId:263624056,families:Object.freeze({wall:'pale-plaster',glass:'deep-glazing',roof:'flat'}),
  wallColor:'#d5cbb8',glassColor:'#294654',roughness:.84,roof:'flat parapet',
  confidence:'photo-estimated',sourceUri:'https://wmw.xjtu.edu.cn/wh/dbcg1/3.htm',
  license:'university-photo-reference-only'
 })],
 [263625085,Object.freeze({
  osmId:263625085,families:Object.freeze({wall:'light-tile',glass:'gray-glazing',roof:'simple'}),
  wallColor:'#d9d8d0',glassColor:'#71878b',roughness:.84,roof:'simplified building',
  confidence:'photo-estimated',sourceUri:'https://commons.wikimedia.org/wiki/File:XJTU_West_1_Office_Building.jpg',
  license:'Commons-reference-verify-before-redistribution'
 })],
 [1167525875,Object.freeze({
  osmId:1167525875,families:Object.freeze({wall:'light-panel',glass:'deep-glazing',roof:'low-wing'}),
  wallColor:'#d5d1c6',glassColor:'#405c68',roughness:.84,roof:'panel-clad high volume and lower entrance wing',
  confidence:'photo-estimated',sourceUri:'https://www.xjtu.edu.cn/tsda/jdxqbwg.htm',
  license:'university-photo-reference-only'
 })]
]);
export function validateMaterialProfile(p){
 if(!p||!Number.isSafeInteger(p.osmId))throw Error('invalid osmId');
 for(const c of ['wallColor','glassColor'])if(!/^#[0-9a-f]{6}$/i.test(p[c]||''))throw Error('invalid '+c);
 if(!p.sourceUri?.startsWith('https://'))throw Error('missing sourceUri');
 if(p.confidence!=='photo-estimated'&&p.confidence!=='verified-sample')throw Error('invalid confidence');
 if(!p.license||!p.families?.wall)throw Error('missing license or family');
 return true;
}
export function getBuildingMaterialProfile(osmId){
 const p=profiles.get(Number(osmId));return p?{...p,families:{...p.families}}:null;
}
