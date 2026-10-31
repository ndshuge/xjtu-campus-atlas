import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createLibraryAsset} from '../src/library-asset.js';

const data=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const library=data.buildings.find(building=>building.osmId===263624481);
assert.ok(library,'Checked-in Qian Xuesen Library source record is required');

function shaderFor(material){
 const shader={
  uniforms:{},
  vertexShader:'#include <worldpos_vertex>',
  fragmentShader:'#include <color_fragment>\n#include <emissivemap_fragment>'
 };
 material.onBeforeCompile(shader,{});
 return shader;
}

test('library stone stays warm and selected/hovered focus uses a restrained Fresnel rim',()=>{
 const asset=createLibraryAsset({building:library,baseY:1.1,buildingIndex:0});
 try{
  const wall=asset.children.find(mesh=>mesh.isMesh&&mesh.name.endsWith('/ wall'));
  assert.ok(wall,'The library must retain its batched wall material');
  assert.equal(wall.material.color.getHexString(),'c3bdb3','2021 south photo supports a lower-chroma warm-gray stone, not orange-beige');
  assert.equal(wall.material.roughness,.84);
  assert.equal(wall.material.transparent,false);

  const shader=shaderFor(wall.material);
  assert.ok(shader.uniforms.uLibSelected,'Selection uniform is retained');
  assert.ok(shader.uniforms.uLibHover,'Hover uniform is retained');
  assert.ok(shader.uniforms.uLibMode,'Category mode uniform is retained');
  assert.ok(shader.uniforms.uLibModeColor,'Category mode color is retained');
  assert.match(shader.fragmentShader,/libFresnel/,'Focus must use a view-space Fresnel term');
  assert.match(shader.fragmentShader,/totalEmissiveRadiance/,'Focus must add a subtle rim, not tint every facade pixel');
  assert.doesNotMatch(shader.fragmentShader,/vec3\(\.48,\.70,\.35\)/,'The previous broad green selection wash must be removed');
  assert.match(wall.material.customProgramCacheKey(),/library-r16-focus/,'Revised shader must not reuse the old cached program');

  const glass=asset.children.find(mesh=>mesh.isMesh&&mesh.name.endsWith('/ glass'));
  assert.ok(glass,'The library must retain its batched opaque glazing');
  assert.equal(glass.material.transparent,false);
  const glassShader=shaderFor(glass.material);
  assert.match(glassShader.fragmentShader,/uLibNight/,'Night uniform remains available');
  assert.match(glassShader.fragmentShader,/totalEmissiveRadiance\s*\+=\s*vec3\(\.22,\.16,\.08\)\s*\*\s*uLibNight/,'Existing night-glass emission remains intact');
 }finally{
  asset.dispose();
 }
});

test('massing stage remains neutral and keeps the library-owned material contract',()=>{
 const asset=createLibraryAsset({building:library,baseY:1.1,buildingIndex:0,stage:'massing'});
 try{
  const wall=asset.children.find(mesh=>mesh.isMesh&&mesh.name.endsWith('/ wall'));
  assert.ok(wall);
  assert.equal(wall.material.color.getHexString(),'bebdb6');
  assert.equal(wall.material.roughness,1);
  const shader=shaderFor(wall.material);
  assert.doesNotMatch(shader.fragmentShader,/uLibSelected|uLibHover|uLibMode|uLibNight|libFresnel/,'Massing preview must keep the original neutral no-op shader');
  assert.equal(wall.material.customProgramCacheKey(),'library-r11-gray','Massing preview must not opt into the material-stage shader program');
 }finally{
  asset.dispose();
 }
});
