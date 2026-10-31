// R17 spatial levels: provenance-gated data only. R16 renderer remains unchanged.
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const validBounds=b=>b&&['minX','maxX','minZ','maxZ'].every(k=>finite(b[k]))
  &&b.minX<b.maxX&&b.minZ<b.maxZ;
const inside=(b,x,z)=>x>=b.minX&&x<=b.maxX&&z>=b.minZ&&z<=b.maxZ;
function levels(items,idKey){
 const seen=new Set();
 return items.map(item=>{
  if(!validBounds(item.bounds))throw Error('invalid bounds');
  if(!item[idKey]||seen.has(item[idKey]))throw Error('duplicate or missing '+idKey);
  seen.add(item[idKey]);
  if(!finite(item.y))throw Error('unknown or invalid elevation for '+item[idKey]);
  if(item.confidence===undefined)throw Error('missing confidence');
  const copy={...item,bounds:Object.freeze({...item.bounds})};
  if(item.normal!==undefined)copy.normal=Object.freeze([...item.normal]);
  return Object.freeze(copy);
 });
}
export function createSpatialLevels({groundZones=[],levelSurfaces=[],passages=[]}={}){
 const ground=levels(groundZones,'id'),surfaces=levels(levelSurfaces,'levelId');
 const known=new Set(surfaces.map(x=>x.levelId));
 const links=passages.map(link=>{
  if(link.verified!==true)throw Error('passage must be verified');
  if(!link.id||!known.has(link.fromLevelId)||!known.has(link.toLevelId))
   throw Error('passage endpoints must reference known surfaces');
  return Object.freeze({...link});
 });
 const clone=x=>x&&({...x,bounds:x.bounds&&{...x.bounds},normal:x.normal&&[...x.normal]});
 return Object.freeze({
  queryGround(x,z,zoneId='campus'){
   if(!finite(x)||!finite(z))return null;
   return clone(ground.find(a=>a.id===zoneId&&inside(a.bounds,x,z)))||null;
  },
  querySurfaces(x,z){
   if(!finite(x)||!finite(z))return [];
   return surfaces.filter(a=>inside(a.bounds,x,z)).sort((a,b)=>b.y-a.y).map(clone);
  },
  getPassage(fromLevelId,toLevelId){
   const found=links.find(a=>(a.fromLevelId===fromLevelId&&a.toLevelId===toLevelId)
      ||(a.fromLevelId===toLevelId&&a.toLevelId===fromLevelId&&a.bidirectional!==false));
   return found?{...found}:null;
  }
 });
}
