import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createWestOneAsset,WEST_ONE_ID} from '../src/west-one-asset.js';
import {stoneMaterial} from '../src/architecture-kit.js';
const data=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const building=data.buildings.find(b=>b.osmId===WEST_ONE_ID),index=data.buildings.indexOf(building);
test('West 1 photo facade tiles are fine, pale and distinct from generic campus stone',()=>{
 const a=createWestOneAsset({building,buildingIndex:index});
 try{
  const tiles=a.userData.photoTileGrid;
  assert.ok(tiles&&tiles.estimated);
  assert.equal(tiles.source,'https://xjtu.party/photos');
  assert.ok(tiles.approxTileMetres>=.24&&tiles.approxTileMetres<=.45);
  const stone=a.children.find(m=>m.name.endsWith('/ stone'));
  assert.ok(stone);
  assert.match(stone.material.customProgramCacheKey(),/west1-tiles/);
  const s={vertexShader:'#include <worldpos_vertex>',fragmentShader:'#include <color_fragment>',uniforms:{}};
  stone.material.onBeforeCompile(s);
  assert.match(s.fragmentShader,/tileCoord/);
  assert.match(s.fragmentShader,/joint/);
  assert.match(s.fragmentShader,/smoothstep/);
  assert.equal(a.children.filter(m=>m.isMesh).length<=5,true,'no extra draws for facade tiles');
 }finally{a.dispose()}
});
test('default stone material retains old shader and key',()=>{
 const m=stoneMaterial('#c8c0b3',.72);
 try{assert.equal(m.customProgramCacheKey(),'campus-stone-0.72');}
 finally{m.dispose()}
});
