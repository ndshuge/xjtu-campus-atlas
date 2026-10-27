import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {pathToFileURL} from 'node:url';import path from 'node:path';import {createLibraryAsset} from '../src/library-asset.js';
let old=execFileSync('git',['show','165a0a3:src/library-asset.js'],{encoding:'utf8'});old=old.replaceAll("from './","from '"+pathToFileURL(path.resolve('src')+path.sep).href);
old=old.replace("from 'three'",'from '+JSON.stringify(import.meta.resolve('three')));
const baseline=(await import('data:text/javascript;base64,'+Buffer.from(old).toString('base64'))).createLibraryAsset;
const building=JSON.parse(fs.readFileSync('public/data/campus.json')).buildings.find(b=>b.osmId===263624481),values={before:[],after:[]};
for(let i=0;i<23;i++)for(const [key,fn] of (i%2?[['after',createLibraryAsset],['before',baseline]]:[['before',baseline],['after',createLibraryAsset]])){
 global.gc?.();const start=performance.now(),a=fn({building,buildingIndex:0}),elapsed=performance.now()-start;a.dispose();if(i>=3)values[key].push(elapsed);
}
const stats=a=>{const s=a.slice().sort((a,b)=>a-b);return {medianMs:s[Math.floor(s.length/2)],p95Ms:s[Math.floor(s.length*.95)],minimumMs:s[0],samples:a};};
const result={method:'Paired alternating Node constructor timing; three warmups, twenty samples per variant; no DOM, WebGL or network; NOT browser startup or GPU evidence',node:process.version,before:stats(values.before),after:stats(values.after)};
fs.writeFileSync('docs/quality-v2/buildings-r12/library-construction-benchmark.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
