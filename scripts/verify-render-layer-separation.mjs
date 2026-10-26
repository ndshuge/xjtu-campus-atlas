import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BASE} from '../src/geo.js';
import {avenuePavingGeometry} from '../src/avenue-paving.js';
import {campusSpineGroundGeometry} from '../src/campus-road-ground.js';
const data=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const a=avenuePavingGeometry(data.roads),b=campusSpineGroundGeometry(data.roads);
const roadSurface=BASE+.125;
const pavement=[...a.sidewalks,...b.sidewalks];
const edge=[...a.edges,...b.edgings];
function ys(geo){const arr=geo.attributes.position;return [...new Set(Array.from({length:arr.count},(_,i)=>Math.round(arr.getY(i)*10000)/10000))];}
for(const g of pavement){const v=ys(g);assert.equal(v.length,1);assert(v[0]-roadSurface>.05&&v[0]-roadSurface<.085,'Pedestrian overlays must be distinct from asphalt, without excessive elevation');}
for(const g of edge){const v=ys(g);assert.equal(v.length,1);assert(v[0]-roadSurface>.06&&v[0]-roadSurface<.09,'Road edge overlays must not share asphalt plane');}
assert(ys(a.centerline)[0]-roadSurface>.09);

import * as THREE from 'three';
import {buildFourInventionsPaving} from '../src/plaza-terrain.js';
const courtyard=buildFourInventionsPaving(new THREE.Scene());
const base=courtyard.children.find(x=>x.name==='OSM open corridor / single paved base');
assert(base,'Four Inventions ground layer missing');
assert(base.position.y-(BASE+.02)>.07,'Four Inventions overlay is dangerously coplanar with the OSM surface');
console.log(JSON.stringify({passed:true,roadY:roadSurface,sidewalkY:ys(pavement[0])[0],edgeY:ys(edge[0])[0],centerY:ys(a.centerline)[0],pavements:pavement.length,edges:edge.length}));
