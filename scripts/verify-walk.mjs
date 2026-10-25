import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pointIn,ribbon} from '../src/geo.js';
import {findSafeWalkStart} from '../src/walk-placement.js';

const data=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const lib=data.buildings.find(b=>b.osmId===263624481);
const building=data.buildings.find(b=>b.osmId===263624057);
assert(lib&&building,'Landmark locations must be sourced from OSM');
const water=data.surfaces.filter(s=>s.kind==='water');
const valid=(p)=>data.boundary.some(b=>pointIn(p,b))&&
  !data.buildings.some(b=>pointIn(p,b.points))&&!water.some(w=>pointIn(p,w.points));
const base={roads:data.roads,boundaries:data.boundary,buildings:data.buildings,water,trees:[]};
for(const b of [lib,building]){
 const xs=b.points.map(p=>p[0]),zs=b.points.map(p=>p[1]);
 const cx=(Math.min(...xs)+Math.max(...xs))/2,south=Math.max(...zs);
 const start=findSafeWalkStart({...base,desired:[cx,south+54],target:[cx,south-4]});
 assert(start,'Expected a fallback or visible walkable location near landmark');
 assert(valid(start.p),'Landmark spawn must not be inside a source footprint or water surface');
 assert(Number.isFinite(start.cost),'Spawn cost must be finite');
}
const blocker={points:[[-8,7],[8,7],[8,13],[-8,13],[-8,7]]};
const synthetic=findSafeWalkStart({
 roads:[],boundaries:[[[-200,-200],[200,-200],[200,200],[-200,200],[-200,-200]]],
 buildings:[blocker],water:[],trees:[],desired:[0,30],target:[0,0]
});
assert(synthetic,'Synthetic courtyard should offer a safe position');
assert(!pointIn(synthetic.p,blocker.points),'Never spawn inside an obstructing building');
const geo=ribbon([[0,0],[10,0],[20,8]],4,1.2);
assert(geo.attributes.uv?.count===geo.attributes.position.count,'Road UV coordinates must match vertices');
assert([...geo.attributes.uv.array].every(Number.isFinite),'Road UV coordinates must be finite');
geo.dispose();
console.log(JSON.stringify({passed:true,realLandmarks:2,syntheticOcclusion:true,roadUv:true}));
