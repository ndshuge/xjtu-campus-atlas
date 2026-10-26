// Deterministic, road-only clipping masks from the already-tracked OSM snapshot.
// This does NOT change campus.json, the buildings, or the OSM road centrelines.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=JSON.parse(fs.readFileSync(path.join(root,'public/data/campus.json'),'utf8'));
const names=new Set(['梧桐西道','学森路','思源路','彭康路','文治路','学苑东路','学苑西路']);
const routes=source.roads.filter(r=>r.campus&&names.has(r.name)&&!/path|footway|steps|cycleway/.test(r.kind));
const bounds=ps=>ps.reduce((b,p)=>[Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])],[Infinity,Infinity,-Infinity,-Infinity]);
const near=(a,b,r=12)=>a[0]<b[2]+r&&a[2]>b[0]-r&&a[1]<b[3]+r&&a[3]>b[1]-r;
const boxes=routes.map(r=>bounds(r.points));
const selected=source.buildings.filter(b=>boxes.some(a=>near(a,bounds(b.points))));
const data=selected.map(b=>({id:b.id,points:b.points}));
const output='// GENERATED from public/data/campus.json. Regenerate via node scripts/generate-road-footprint-mask.mjs.\n'
+'// This is an immutable clipping reference, not a new building model.\n'
+'export const ROAD_ONLY_BUILDING_MASKS='+JSON.stringify(data)+';\n';
fs.writeFileSync(path.join(root,'src/campus-road-exclusions.js'),output,'utf8');
console.log(JSON.stringify({selectedBuildings:data.length,totalBuildings:source.buildings.length,bytes:Buffer.byteLength(output)}));
