import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const args=process.argv.slice(2),root=new URL('../',import.meta.url);
if(args.length<2)throw Error('Usage: node scripts/qa-library-r11.mjs URL OUTPUT [POSES] [WIDTHS] [DPR]');
const paths=['src/world.js','src/library-asset.js','src/library-asset-plan.js','src/building-silhouettes.js','src/library-r11-review.js','src/library-facade.js','src/library-massing.js','scripts/library-r11-integration.mjs','scripts/qa-render.mjs','public/data/campus.json'];
const hashes=()=>Object.fromEntries(paths.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(new URL(p,root))).digest('hex')]));
const before=hashes();
const result=spawnSync(process.execPath,['scripts/qa-render.mjs',...args],{stdio:'inherit',windowsHide:true});
if(result.status!==0)process.exit(result.status||1);
assert.deepEqual(hashes(),before,'Scene source changed while screenshots were being captured');
const file=new URL(args[1].replaceAll('\\','/')+'/browser-results.json',root),report=JSON.parse(fs.readFileSync(file));
const rows=Array.isArray(report)?report:report.results;
assert(rows?.length,'No browser renders recorded');
for(const row of rows){
 const audit=row.runtime?.libraryAudit;
 assert(audit,'Screenshot did not load the fixed library review entry');
 assert.equal(audit.pose,row.pose,'Screenshot pose mismatch');
 if(audit.variant==='R11'){
  assert.equal(audit.genericVertices,0,'Generic library geometry survived replacement');
  assert.deepEqual(Object.keys(audit.owners),['library-asset.js'],'Multiple visual owners survived');
  assert.equal(audit.hitInterface.id,'way/263624481');
  assert.equal(audit.hitInterface.index,audit.dataIdentity.index,'Picking index changed');
 }
}
fs.writeFileSync(new URL(args[1].replaceAll('\\','/')+'/source-lock.json',root),JSON.stringify({checkedAt:new Date().toISOString(),sourceHashes:before,sourceStable:true,renders:rows.length},null,2)+'\n');
console.log(JSON.stringify({libraryR11ReviewPassed:true,renders:rows.length,sourceStable:true}));
