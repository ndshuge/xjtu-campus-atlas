import test from 'node:test';
import assert from 'node:assert/strict';
import {createMapModeBridge,toMapCoords} from '../src/amap-mode-bridge.js';
test('world xz converts through WGS84 and provider conversion only when available',async()=>{
 const src={x:100,z:50};
 const result=await toMapCoords(src,{origin:[108,34],metresPerDegree:[100000,100000]},async ([lon,lat])=>[lon+.003,lat+.003]);
 assert.deepEqual(result,[108.004,34.0025]);
 await assert.rejects(toMapCoords(src,{origin:[108,34],metresPerDegree:[100000,100000]},null),/conversion unavailable/);
});
test('AMap mode failure/permission denial restores atlas state without leaking secret',async()=>{
 const current={selected:263624481,camera:{x:4,y:5,z:6}};
 const bridge=createMapModeBridge({capture:()=>structuredClone(current),restore:s=>Object.assign(current,s),open:async()=>{throw Error('HTTP 403')}});
 assert.equal((await bridge.switchMapMode('amap')).mode,'atlas');
 assert.equal(bridge.mode,'atlas');
 assert.equal(current.selected,263624481);
 const denied=createMapModeBridge({capture:()=>({}),restore:()=>{},open:async()=>true,consent:()=>false});
 assert.equal((await denied.switchMapMode('amap')).mode,'atlas');
});
test('successful provider switch and return restore selection/camera state',async()=>{
 let current={selected:5,camera:{yaw:1}},closed=0;
 const b=createMapModeBridge({capture:()=>structuredClone(current),restore:s=>{current=s},open:async()=>true,close:()=>{closed++}});
 assert.equal((await b.switchMapMode('amap')).mode,'amap');
 current={selected:null,camera:{yaw:0}};
 assert.equal((await b.switchMapMode('atlas')).mode,'atlas');
 assert.equal(current.selected,5);
 assert.equal(current.camera.yaw,1);
 assert.equal(closed,1);
});
