import {performance} from 'node:perf_hooks';
import {Vector3} from 'three';
import {createCampusVegetation} from '../src/campus-vegetation.js';

const ctx={clearRect(){},save(){},translate(){},rotate(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},restore(){}};
globalThis.document={createElement(){return {width:0,height:0,getContext(){return ctx}}}};
const trees=Array.from({length:2092},(_,i)=>({x:1000+(i%50)*8,z:1000+Math.floor(i/50)*8,h:10,r:3.6,c:(i%100)/100,type:i%3}));
const vegetation=createCampusVegetation(trees),camera={position:new Vector3(0,3,0)};
vegetation.update(camera,0,true);
const samples={unchanged:[],forced:[]};let now=0;
for(let i=0;i<100;i++)for(const forced of (i%2?[true,false]:[false,true])){
 camera.position.x=camera.position.x===0?4:0;
 now+=1000;const t=performance.now();vegetation.update(camera,now,forced);const elapsed=performance.now()-t;
 if(i>=10)samples[forced?'forced':'unchanged'].push(elapsed);
}
const stats=x=>{const s=[...x].sort((a,b)=>a-b);return {n:s.length,p50:s[Math.floor(s.length*.5)],p95:s[Math.floor(s.length*.95)]}};
console.log(JSON.stringify({description:'Synthetic 2092-tree unchanged-LOD update only; forced rebuild models old CPU work; not browser frame time or GPU time.',unchanged:stats(samples.unchanged),forced:stats(samples.forced),samples},null,2));
