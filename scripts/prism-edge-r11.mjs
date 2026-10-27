// Run the unmodified Prism verifier with the already installed Edge executable.
// Browser choice only; no verifier assertion or application code is changed.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const [driver,url,out]=process.argv.slice(2);
if(!driver||!url||!out||!process.env.PRISM_PW)throw Error('Usage: PRISM_PW=<runtime-node-root> node scripts/prism-edge-r11.mjs <Prism driver> <URL> <output>');
const require=createRequire(path.join(process.env.PRISM_PW,'r11-runtime.cjs')),{chromium}=require('playwright');
const edge=process.env.XJTU_QA_EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
if(!fs.existsSync(edge))throw Error('Existing Edge executable unavailable');
const launch=chromium.launch.bind(chromium);
chromium.launch=options=>launch({...options,executablePath:edge});
process.argv=[process.execPath,driver,url,'--out',out,'--shots','1'];
await import(pathToFileURL(path.resolve(driver)).href);
