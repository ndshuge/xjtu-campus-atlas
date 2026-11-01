// R21 Z>=0 evidence-bounded asset handoff. No shared world.js edits.
// 'replace' means skip the generic building volume and its generic rooftop AC.
// 'overlay' means retain the full host building and add small bespoke detail.
// 'connector' preserves TWO host dorms and adds their linking structure.
// 'existing' is already routed by src/world.js, so never mount it twice.
export const NORTH_INTEGRATION_SPECS=Object.freeze([
 {key:'relocation-museum',mode:'existing',hostIds:[1167525875],module:'../../relocation-museum-asset.js',factory:'createRelocationMuseumAsset'},
 {key:'pengkang-compound',mode:'replace',hostIds:[263807970],module:'pengkang-compound-asset.js',factory:'createPengkangCompoundAsset'},
 {key:'nanyang-east7',mode:'replace',hostIds:[263808678],module:'nanyang-east7-asset.js',factory:'createNanyangEast7Asset'},
 {key:'nanyang-east8',mode:'replace',hostIds:[263808679],module:'nanyang-east8-asset.js',factory:'createNanyangEast8Asset'},
 {key:'nanyang-east9',mode:'replace',hostIds:[263808680],module:'nanyang-east9-asset.js',factory:'createNanyangEast9Asset'},
 {key:'kangqiao',mode:'replace',hostIds:[263625679],module:'kangqiao-dining-asset.js',factory:'createKangqiaoDiningAsset'},
 {key:'lizhi-starspace',mode:'overlay',hostIds:[263808681],module:'lizhi-starspace-asset.js',factory:'createLizhiStarspaceAsset',input:'dorm'},
 {key:'siyuan-roof-monitor',mode:'overlay',hostIds:[263624056],module:'siyuan-roof-monitor-asset.js',factory:'createSiyuanRoofMonitorAsset'},
 {key:'foreign-languages-entrance',mode:'overlay',hostIds:[263633896],module:'foreign-languages-entrance-asset.js',factory:'createForeignLanguagesEntranceAsset'},
 {key:'campus-hospital-entry',mode:'overlay',hostIds:[264106102],module:'campus-hospital-entry-asset.js',factory:'createCampusHospitalEntryAsset'},
 {key:'west13-entrance',mode:'overlay',hostIds:[264106086],module:'west13-entrance-asset.js',factory:'createWest13EntranceAsset'},
 {key:'chongshi-link',mode:'connector',hostIds:[263808683,263808684],module:'chongshi-link-asset.js',factory:'createChongshiLinkAsset',input:'west16+west17'}
].map(x=>Object.freeze({...x,hostIds:Object.freeze([...x.hostIds])})));

export function getNorthIntegrationPlan(campus){
 if(!Array.isArray(campus?.buildings))throw Error('North integration requires campus.buildings');
 const map=new Map(campus.buildings.map((b,i)=>[b.osmId,{b,i}]));
 const keys=new Set(), claims=new Set();
 const skipGenericIds=[],preserveGenericIds=[],alreadyIntegratedIds=[];
 const entries=NORTH_INTEGRATION_SPECS.map(spec=>{
  if(keys.has(spec.key))throw Error('Duplicate north asset key: '+spec.key);
  keys.add(spec.key);
  const hostIndexes=spec.hostIds.map(id=>{
   const item=map.get(id);
   if(!item)throw Error('Missing OSM '+id);
   if(item.b.center?.[1]<0)throw Error('Wrong Z partition for '+id);
   if(spec.mode!=='connector'){
    if(claims.has(id))throw Error('Overlapping north asset ownership '+id);
    claims.add(id);
   }
   return item.i;
  });
  const id=spec.hostIds[0];
  if(spec.mode==='replace')skipGenericIds.push(id);
  if(spec.mode==='overlay')preserveGenericIds.push(id);
  if(spec.mode==='existing')alreadyIntegratedIds.push(id);
  return {...spec,hostIndexes};
 });
 return {entries,skipGenericIds,preserveGenericIds,alreadyIntegratedIds};
}
