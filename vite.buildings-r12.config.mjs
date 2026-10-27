import {execFileSync} from 'node:child_process';
import {defineConfig,mergeConfig} from 'vite';
import base from './vite.config.js';
const baseline='165a0a355faef670a87f7a7a3c07ddce9095b5b4';
export default defineConfig(({mode})=>{
 const originals=new Map();
 return mergeConfig(base,{cacheDir:'.cache-r12/'+mode,plugins:[{
  name:'r12-readonly-baseline',enforce:'pre',
  transform(code,id){if(mode!=='r12-baseline')return;const file=id.replaceAll('\\','/').split('/src/')[1];
   if(!['world.js','building-silhouettes.js','library-asset.js'].includes(file))return;
   if(!originals.has(file))originals.set(file,execFileSync('git',['show',baseline+':src/'+file],{encoding:'utf8'}));
   return {code:originals.get(file),map:null};
  }
 }],build:{outDir:mode==='r12-baseline'?'dist-r12-baseline':'dist-r12-buildings',rollupOptions:{input:{index:'index.html',review:'buildings-r12-review.html'}}}});
});
