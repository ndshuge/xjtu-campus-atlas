import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({ base: './', publicDir: path.resolve(process.cwd(), '../../public') });
