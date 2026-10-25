import fs from 'node:fs/promises';
const output=new URL('../data/source-osm.json',import.meta.url);
const query='[out:json][timeout:90];(way(34.238,108.968,34.259,109.002);relation["type"="multipolygon"](34.238,108.968,34.259,109.002);node["name"](34.238,108.968,34.259,109.002););out body geom;';
let result;
for(const endpoint of ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://overpass.private.coffee/api/interpreter']){
 try{console.log('Fetching',endpoint);const response=await fetch(endpoint,{method:'POST',body:new URLSearchParams({data:query}),headers:{'User-Agent':'XJTU-Campus-Atlas/1.0 (OSM research)'},signal:AbortSignal.timeout(115000)});if(!response.ok)throw Error('HTTP '+response.status);result=await response.json();if(!result.elements?.some(e=>e.type==='relation'&&e.id===17568632&&e.members?.length))throw Error('Campus relation missing');break;}catch(error){console.warn(String(error));}
}
if(!result)throw Error('All Overpass endpoints failed. The existing source snapshot was preserved.');
await fs.mkdir(new URL('../data/',import.meta.url),{recursive:true});await fs.writeFile(new URL('../data/source-osm.next.json',import.meta.url),JSON.stringify(result));await fs.rename(new URL('../data/source-osm.next.json',import.meta.url),output);console.log('Saved',result.elements.length,'elements. Run npm run data to regenerate.');
