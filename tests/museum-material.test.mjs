import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRelocationMuseumAsset,RELOCATION_MUSEUM_ID} from '../src/relocation-museum-asset.js';

const data=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url)));
const museum=data.buildings.find(b=>b.osmId===RELOCATION_MUSEUM_ID);
const index=data.buildings.indexOf(museum);

test('Museum masonry has lightly articulated cladding without extra draw calls',()=>{
 const detailed=createRelocationMuseumAsset({building:museum,buildingIndex:index});
 const gray=createRelocationMuseumAsset({building:museum,buildingIndex:index,stage:'massing'});
 const stone=detailed.children.find(m=>m.isMesh&&m.name.includes('/ stone'));
 const glass=detailed.children.find(m=>m.isMesh&&m.name.includes('/ glass'));
 assert(stone&&glass,'museum must retain its owned material batches');
 assert(detailed.children.filter(x=>x.isMesh).length<=6,'material finishing must not introduce extra mesh batches');
 const shader={vertexShader:'#include <worldpos_vertex>\n#include <begin_vertex>',
  fragmentShader:'#include <color_fragment>',uniforms:{}};
 stone.material.onBeforeCompile(shader);
 assert.match(shader.fragmentShader,/museumPanelSeam/,'visible panel divisions from material shader');
 assert.match(shader.fragmentShader,/fwidth\(/,'mip-aware anti-aliased panel lines');
 assert.match(stone.material.customProgramCacheKey(),/museum-panel/,'stable shader cache');
 assert(glass.material.roughness<=.35,'museum glazing should read as glass without physical transmission');
 assert.equal(glass.material.transparent,false);
 detailed.dispose();gray.dispose();
});
