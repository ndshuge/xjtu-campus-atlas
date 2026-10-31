import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createLibraryAsset} from '../src/library-asset.js';

const campus=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const building=campus.buildings.find(b=>b.osmId===263624481);

test('2025 aerial: green roofs have coherent vegetation patches, not pixel noise or a new material batch',()=>{
 const a=createLibraryAsset({building,buildingIndex:0});
 try{
  assert.equal(a.children.length,7,'Keep the same material batch count');
  const turf=a.children.find(m=>m.isMesh&&m.name.endsWith('/ groundcover'));
  assert.ok(turf?.material.map?.isDataTexture,'Reuse the owned procedural roof turf texture');
  const image=turf.material.map.image,{data,width,height}=image;
  assert.equal(width,64);assert.equal(height,64);
  const r=(x,y)=>data[(y*width+x)*4];
  let near=0,far=0,n=0,lo=255,hi=0;
  for(let y=3;y<height-3;y+=3)for(let x=3;x<width-14;x+=3){
   const a=r(x,y),b=r(x+1,y),c=r(x+11,y);
   near+=Math.abs(a-b);far+=Math.abs(a-c);n++;
   lo=Math.min(lo,a,b,c);hi=Math.max(hi,a,b,c);
  }
  assert.ok(hi-lo>=25,'Vegetation should have visible but restrained photo-supported tonal variation');
  assert.ok(far/n>near/n*1.5,'Connected low-frequency turf areas must dominate unrelated high-frequency noise');
  assert.equal(turf.material.map.wrapS,turf.material.map.wrapT,'Repeat without a new atlas/material');
 }finally{a.dispose();}
});
