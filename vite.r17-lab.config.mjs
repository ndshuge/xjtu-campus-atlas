import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({
 base:'./',
 build:{outDir:'.sites-local/r17-game-lab-20261031',emptyOutDir:true,rollupOptions:{input:{atlas:resolve(process.cwd(),'index.html'),lab:resolve(process.cwd(),'r17-lab.html')}}}
});
