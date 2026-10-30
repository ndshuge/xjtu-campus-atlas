import test from 'node:test';
import assert from 'node:assert/strict';
import {generateSurfacePixels, surfaceSampling} from '../src/surface-textures.js';
import {generateLeafletSprays} from '../src/campus-vegetation.js';

const sample=(p,w,x,y)=>Array.from(p.slice((y*w+x)*4,(y*w+x)*4+4));
const brightness=p=>(p[0]+p[1]+p[2])/3;

test('major 1: seeded road and plaza albedo differs; paver joints read darker',()=>{
  const a=generateSurfacePixels('asphalt',256);
  const b=generateSurfacePixels('pavers',256);
  assert.equal(a.length,256*256*4);assert.equal(b.length,a.length);
  assert.deepEqual(a,generateSurfacePixels('asphalt',256));
  assert.notDeepEqual(a,b);
  const joint=brightness(sample(b,256,32,47));
  const face=brightness(sample(b,256,82,47));
  assert(face-joint>12, 'paving joints must remain visible at camera scale');
  assert(brightness(sample(a,256,50,100))<brightness(sample(b,256,50,100)));
});

test('minor 2: source textures are mipmapped sRGB with safe bounded anisotropy',()=>{
  const settings=surfaceSampling('pavers',16);
  assert.equal(settings.colorSpace,'srgb');
  assert.equal(settings.minFilter,'LinearMipmapLinearFilter');
  assert.equal(settings.magFilter,'LinearFilter');
  assert.equal(settings.generateMipmaps,true);
  assert(settings.anisotropy>=1&&settings.anisotropy<=8);
  assert.equal(surfaceSampling('asphalt',2).anisotropy,2);
});

test('major 3: organic foliage sprays are varied, deterministic and species aware',()=>{
  const near=generateLeafletSprays(false,false);
  const far=generateLeafletSprays(false,true);
  const pine=generateLeafletSprays(true,false);
  assert(near.length>=70&&near.length<=150);
  assert(far.length>=50);
  assert.deepEqual(near,generateLeafletSprays(false,false));
  assert.notDeepEqual(near,pine);
  assert(near.some(s=>s.lobes>=3));
  assert(near.some(s=>s.lobes>=5));
  assert(near.some(s=>s.angle!==0));
  assert(near.every(s=>Number.isFinite(s.x)&&Number.isFinite(s.y)&&s.radius>0));
});
