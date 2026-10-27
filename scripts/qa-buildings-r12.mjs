import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
const args=process.argv.slice(2),paths=['src/world.js','src/building-asset-kit.js','src/main-complex-asset.js','src/building-silhouettes.js','src/library-asset.js','src/buildings-r12-review.js','public/data/campus.json'];
if(fs.existsSync('src/science-hall-asset.js'))paths.push('src/science-hall-asset.js');
const hashes=()=>Object.fromEntries(paths.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')])),before=hashes();
const run=spawnSync(process.execPath,['scripts/qa-render.mjs',...args],{stdio:'inherit',windowsHide:true});if(run.status)process.exit(run.status);
assert.deepEqual(hashes(),before,'Building source changed during render');
const report=JSON.parse(fs.readFileSync(args[1]+'/browser-results.json'));
for(const r of report.results){assert.equal(r.runtime.buildingAudit?.pose,r.pose,'Not the fixed building review entry');for(const name of ['main','science','library']){const a=r.runtime.buildingAudit[name];if(a.owners.some(x=>x.endsWith('-asset.js')))assert.equal(a.genericVertices,0,'Duplicate generic '+name);}}
fs.writeFileSync(args[1]+'/source-lock.json',JSON.stringify({checkedAt:new Date().toISOString(),sourceStable:true,sourceHashes:before,renders:report.results.length},null,2)+'\n');
console.log(JSON.stringify({sourceStable:true,renders:report.results.length}));
