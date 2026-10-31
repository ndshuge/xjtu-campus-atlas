import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpatialLevels} from '../src/campus-spatial-levels.js';
const box={minX:0,minZ:0,maxX:20,maxZ:20};
const layers={
 groundZones:[{id:'campus',bounds:box,y:1.1,normal:[0,1,0],confidence:'fixture-measured'}],
 levelSurfaces:[{levelId:'upper',bounds:box,y:1.1,kind:'platform',walkable:true,confidence:'fixture-measured'},
 {levelId:'lower',bounds:box,y:-2.0,kind:'court',walkable:true,confidence:'fixture-measured'}],
 passages:[]};
test('two independently queried levels do not collapse into one elevation',()=>{
 const store=createSpatialLevels(layers);
 assert.equal(store.queryGround(10,10)?.y,1.1);
 assert.deepEqual(store.querySurfaces(10,10).map(x=>[x.levelId,x.y]),[['upper',1.1],['lower',-2]]);
 assert.equal(store.getPassage('upper','lower'),null);
 assert.equal(store.queryGround(-2,10),null);
 assert.deepEqual(store.querySurfaces(-2,10),[]);
});
test('unknown depth is not silently replaced with ground or a guessed passage',()=>{
 assert.throws(()=>createSpatialLevels({levelSurfaces:[{levelId:'unknown',bounds:box,y:null,kind:'court',walkable:true,confidence:'photo'}]}),/elevation/);
 assert.throws(()=>createSpatialLevels({passages:[{fromLevelId:'upper',toLevelId:'lower',verified:false}]}),/verified/);
 assert.equal(createSpatialLevels().queryGround(5,5),null);
 assert.deepEqual(createSpatialLevels().querySurfaces(5,5),[]);
});
test('invalid positions, objects and colliding ids rejected; mutations do not affect registry',()=>{
 assert.throws(()=>createSpatialLevels({groundZones:[{id:'campus',bounds:{minX:2,maxX:1,minZ:0,maxZ:1},y:1.1}]}),/bounds/);
 assert.throws(()=>createSpatialLevels({levelSurfaces:[layers.levelSurfaces[0],layers.levelSurfaces[0]]}),/duplicate/);
 const store=createSpatialLevels(layers);
 assert.equal(store.queryGround(NaN,5),null);
 assert.ok(Object.isFrozen(store));
 const hit=store.querySurfaces(5,5);hit[0].y=91;
 assert.equal(store.querySurfaces(5,5)[0].y,1.1);
 assert.throws(()=>{store.queryGround=()=>91},TypeError);
});
test('only explicit verified connectors allow traversal',()=>{
 const store=createSpatialLevels({...layers,passages:[{id:'stairs-fixture',fromLevelId:'upper',toLevelId:'lower',verified:true,kind:'stairs',confidence:'fixture-measured'}]});
 assert.equal(store.getPassage('upper','lower')?.id,'stairs-fixture');
 assert.equal(store.getPassage('lower','upper')?.id,'stairs-fixture');
 assert.equal(store.getPassage('upper','absent'),null);
});
