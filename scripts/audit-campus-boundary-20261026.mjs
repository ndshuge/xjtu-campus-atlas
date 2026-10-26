/**
 * Geographic scope audit for Xingqing Campus, 2026-10-26.
 * Historical dimensions encompass the third residential village;
 * NEVER calibrate mapped OSM core campus by that figure.
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';
const d=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const rings=d.boundary;
assert.equal(d.projection.type,'local-equirectangular');
assert.equal(d.projection.units,'metres');
assert.equal(d.projection.x,'east');
assert.equal(d.projection.z,'south');
assert.equal(d.metadata.osmRelation,17568632);
assert(Array.isArray(rings)&&rings.length>0,'Missing campus boundary');
assert(Array.isArray(d.origin)&&d.origin.length===2&&d.origin.every(Number.isFinite),'Missing WGS84 origin');
const m=d.projection.metresPerDegree;
assert(Array.isArray(m)&&m.length===2&&m.every(v=>v>90000&&v<112000),'Unreasonable WGS84 scale');
const all=[];
const ringReports=[];
for(const [id,ring] of rings.entries()){
  assert(ring.length>=4,'Short boundary ring');
  assert.deepEqual(ring[0],ring.at(-1),'Unclosed boundary');
  for(const point of ring){
    assert(point.length===2&&point.every(Number.isFinite),'Invalid boundary vertex');
    all.push(point);
  }
  const x=ring.map(p=>p[0]),z=ring.map(p=>p[1]);
  ringReports.push({ring:id,vertices: ring.length,west:Math.min(...x),east:Math.max(...x),north:Math.min(...z),south:Math.max(...z)});
}
const xs=all.map(p=>p[0]),zs=all.map(p=>p[1]);
const bounds={west:Math.min(...xs),east:Math.max(...xs),north:Math.min(...zs),south:Math.max(...zs)};
const width=+(bounds.east-bounds.west).toFixed(3),length=+(bounds.south-bounds.north).toFixed(3);
assert(width>600&&width<2500&&length>600&&length<2000,'Likely scale/unit regression');
const anchors=[...d.landmarks,...d.pois].filter(p=>Number.isFinite(p.lon)&&Number.isFinite(p.lat)&&Array.isArray(p.position)).slice(0,24);
assert(anchors.length>=2,'Insufficient OSM anchors');
let error=0;
for(const p of anchors){
  const expectedX=(p.lon-d.origin[0])*m[0],expectedZ=(d.origin[1]-p.lat)*m[1];
  error=Math.max(error,Math.hypot(expectedX-p.position[0],expectedZ-p.position[1]));
}
assert(error<0.1,'WGS84 landmark projection mismatch');
const historical={widthMetres:1538.64,lengthMetres:1084.432,published:'2015-02-28',source:'https://www.xjtu.edu.cn/info/1248/5709.htm',scope:'West campus wall to east wall of third residential village; includes extra residential and surrounding land'};
console.log(JSON.stringify({ok:true,osmSource:d.metadata.source,osmTimestamp:d.metadata.osmTimestamp,unit:'m',numberOfRings:rings.length,ringReports,bounds,widthMetres:width,heightMetres:length,coordinateAnchorsTested:anchors.length,maxProjectionErrorMetres:+error.toFixed(4),historical,differenceMetres:[+(width-historical.widthMetres).toFixed(3),+(length-historical.lengthMetres).toFixed(3)],classification:'HISTORICAL_SCOPE_NOT_COMPARABLE_TO_OSM_BOUNDARY',decision:'Do not rescale or relocate campus structures from this comparison; obtain a matched-scope perimeter survey'},null,2));
