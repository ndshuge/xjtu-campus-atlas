import fs from 'node:fs';
import {defineConfig,mergeConfig} from 'vite';
import base from './vite.config.js';
import {integrateLibraryWorld} from './scripts/library-r11-integration.mjs';

export default defineConfig(({mode})=>mergeConfig(base,{
 cacheDir:'.cache-r11/'+mode,
 plugins:[{
  name:'library-r11-isolated-integration',enforce:'pre',
  transform(code,id){if(mode!=='r11-baseline'&&id.replaceAll('\\','/').endsWith('/src/world.js'))return {code:integrateLibraryWorld(code.replaceAll('\r\n','\n')),map:null};},
  configureServer(server){server.middlewares.use('/library-r11-review.html',(req,res)=>{server.transformIndexHtml('/library-r11-review.html',reviewHtml()).then(html=>{res.setHeader('Content-Type','text/html');res.end(html);});});},
 }],
 build:{outDir:'dist-r11-library',rollupOptions:{input:{index:'index.html',review:'library-r11-review.html'}}}
}));
function reviewHtml(){return fs.readFileSync(new URL('./index.html',import.meta.url),'utf8').replace('src="/src/app.js"','src="/src/library-r11-review.js"').replace('src="./src/app.js"','src="./src/library-r11-review.js"');}
