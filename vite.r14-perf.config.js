import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({base:'./',build:{chunkSizeWarningLimit:750,rollupOptions:{input:{index:resolve(process.cwd(),'index.html'),review:resolve(process.cwd(),'r14-performance.html')}}}});
