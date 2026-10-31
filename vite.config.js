import {defineConfig} from 'vite';
export default defineConfig({base:'./',build:{chunkSizeWarningLimit:750,rolldownOptions:{input:{main:'index.html',lab:'r17-lab.html'}}}});
