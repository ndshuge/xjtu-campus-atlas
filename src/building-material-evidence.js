// R17: evidence-backed, explicit facade profiles. Unknown buildings keep R16 fallback.
const profiles=new Map([
 [263624481,Object.freeze({
  osmId:263624481,
  families:Object.freeze({wall:'stone',glass:'tinted-glass',roof:'green-roof'}),
  wallColor:'#c3bdb3',glassColor:'#344c58',roughness:.84,
  roof:'tiered with green sections',confidence:'photo-estimated',
  sourceUri:'https://commons.wikimedia.org/wiki/File:%E8%A5%BF%E5%AE%89%E4%BA%A4%E9%80%9A%E5%A4%A7%E5%AD%A6_%E9%92%B1%E5%AD%A6%E6%A3%AE%E5%9B%BE%E4%B9%A6%E9%A6%86%E5%92%8C%E5%9B%9B%E5%A4%A7%E5%8F%91%E6%98%8E%E5%B9%BF%E5%9C%BA.jpg',
  license:'CC BY-SA 4.0'
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
