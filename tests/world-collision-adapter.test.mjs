import test from 'node:test';
import assert from 'node:assert/strict';
import {buildColliderProxies} from '../src/world-collision-adapter.js';
const world={version:'test1',levelSurfaces:[{levelId:'upper',bounds:{minX:0,minZ:0,maxX:10,maxZ:10},y:1.1,walkable:true,confidence:'fixture-measured'},
{levelId:'unknown',bounds:{minX:0,minZ:0,maxX:10,maxZ:10},y:null,walkable:true,confidence:'photo'}]};
test('collision proxies use source data and reject unknown photographed heights',()=>{
 const proxies=buildColliderProxies(world,{minX:2,minZ:2,maxX:8,maxZ:8});
 assert.equal(proxies.length,1);
 assert.equal(proxies[0].levelId,'upper');
 assert.equal(proxies[0].y,1.1);
 assert.equal(proxies[0].shape,'horizontal-surface');
 assert.equal(proxies[0].sourceVersion,'test1');
 assert.throws(()=>{proxies[0].y=22},TypeError);
 assert.equal(world.levelSurfaces[0].y,1.1);
});
test('remote and absent colliders are excluded and no fake underground passage exists',()=>{
 assert.deepEqual(buildColliderProxies(world,{minX:100,minZ:100,maxX:200,maxZ:200}),[]);
 assert.deepEqual(buildColliderProxies({levelSurfaces:[]},{}),[]);
});
