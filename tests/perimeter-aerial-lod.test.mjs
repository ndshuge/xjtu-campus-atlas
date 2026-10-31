import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCampusPerimeter,perimeterBlocksPosition} from '../src/campus-perimeter.js';
import {BASE} from '../src/geo.js';

const data=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
test('aerial perimeter keeps OSM plinth and all gap/collision data while dropping unsurveyed rail detail',()=>{
 const p=createCampusPerimeter(data.boundary,[...data.landmarks,...data.pois],BASE,data.roads,data.buildings);
 try{
  assert.equal(p.children.length,5);
  const plinth=p.children.find(o=>o.name.includes('masonry plinth'));
  const rails=p.children.filter(o=>o!==plinth);
  assert.ok(plinth&&rails.length===4);
  const prior=JSON.stringify(p.userData.colliderSegments);
  const gaps=JSON.stringify(p.userData.gateClearances);
  const geometryIds=p.children.map(o=>o.geometry.uuid);
  assert.ok(p.userData.segmentCount>0);
  p.updateDetailLOD({position:{y:900}});
  assert.equal(plinth.visible,true);
  assert.ok(rails.every(o=>!o.visible),'high campus panorama hides only unmeasured rail detail');
  p.updateDetailLOD({position:{y:100}});
  assert.ok(rails.every(o=>o.visible),'approaching wall restores all schematic rail layers');
  p.updateDetailLOD({position:{y:420}});
  assert.ok(rails.every(o=>o.visible),'hysteresis prevents flicker on approach');
  p.updateDetailLOD({position:{y:900}});
  p.updateDetailLOD({position:{y:420}});
  assert.ok(rails.every(o=>!o.visible),'hysteresis prevents flicker on retreat');
  p.updateDetailLOD({position:{y:290}});
  assert.ok(rails.every(o=>o.visible));
  assert.equal(JSON.stringify(p.userData.colliderSegments),prior);
  assert.equal(JSON.stringify(p.userData.gateClearances),gaps);
  assert.deepEqual(p.children.map(o=>o.geometry.uuid),geometryIds);
  const a=p.userData.colliderSegments[0];
  assert.equal(perimeterBlocksPosition(p,[(a.a[0]+a.b[0])/2,(a.a[1]+a.b[1])/2]),true);
 }finally{p.children.forEach(o=>{o.geometry.dispose();o.material.dispose()})}
});
