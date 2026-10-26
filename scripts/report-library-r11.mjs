import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {integrateLibraryWorld} from './library-r11-integration.mjs';
const root=path.resolve(new URL('../',import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
const output=path.join(root,'docs/quality-v2/library-r11');fs.mkdirSync(output,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p)));
const before=read('docs/quality-v2/library-r11-baseline-production/browser-results.json'),after=read('docs/quality-v2/library-r11-validated/browser-results.json');
// Keep the earlier close oblique (including its mobile crop) as evidence;
// append, rather than replace it with, a whole-building paired oblique.
before.results.push(...read('docs/quality-v2/library-r11-oblique-baseline-review/browser-results.json').results);
const comparisons=after.results.map(r=>{
 const old=before.results.find(b=>b.pose===r.pose&&b.width===r.width);assert(old,'Missing paired baseline');
 for(const key of ['camera','target'])assert(r.runtime[key].every((x,i)=>Math.abs(x-old.runtime[key][i])<1e-4),'Camera changed in A/B: '+r.pose);
 assert.equal(r.metrics.dpr,old.metrics.dpr);
 const a=old.runtime.libraryAudit,b=r.runtime.libraryAudit;
 assert.equal(b.genericVertices,0);assert.equal(a.dataIdentity.id,b.dataIdentity.id);
 return {pose:r.pose,width:r.width,sameCamera:true,
  scene:{before:{triangles:old.runtime.triangles,drawCalls:old.runtime.drawCalls,textures:old.runtime.textures,fps:old.runtime.fps,loadMs:old.runtime.sceneLoadMs},after:{triangles:r.runtime.triangles,drawCalls:r.runtime.drawCalls,textures:r.runtime.textures,fps:r.runtime.fps,loadMs:r.runtime.sceneLoadMs}},
  library:{before:{triangles:a.triangles+a.genericVertices/3+2,materials:a.materials+2,textures:a.textures+1,meshes:Object.values(a.owners).reduce((s,n)=>s+n,0)+2},after:{triangles:b.triangles,materials:b.materials,textures:b.textures,meshes:Object.values(b.owners).reduce((s,n)=>s+n,0)}},
  before:old.file,after:r.file};
});
function bundle(directory){const folder=path.join(root,directory,'assets'),files=fs.readdirSync(folder).filter(f=>f.endsWith('.js')&&!f.startsWith('review-'));return {files:files.map(file=>{const b=fs.readFileSync(path.join(folder,file));return {file,bytes:b.length,gzipBytes:gzipSync(b).length};}),bytes:files.reduce((n,f)=>n+fs.statSync(path.join(folder,f)).size,0),gzipBytes:files.reduce((n,f)=>n+gzipSync(fs.readFileSync(path.join(folder,f))).length,0)};}
const freshBefore=read('docs/quality-v2/library-r11-fresh-baseline/browser-results.json'),freshAfter=read('docs/quality-v2/library-r11-fresh-validated/browser-results.json');
const freshFrameComparisons=freshAfter.results.map(r=>{
 const old=freshBefore.results.find(b=>b.pose===r.pose&&b.width===r.width);assert(old);
 for(const row of [old,r]){assert.equal(row.frameSample.timedOut,false);assert.equal(row.frameSample.documentHidden,false);assert.equal(row.frameSample.freshFrames,120);assert(row.frameSample.renderedFrames>=120);}
 for(const key of ['camera','target'])assert(r.runtime[key].every((x,i)=>Math.abs(x-old.runtime[key][i])<1e-4));
 return {pose:r.pose,width:r.width,gpu:r.gpu,before:{sample:old.frameSample,sceneLoadMs:old.runtime.sceneLoadMs},after:{sample:r.frameSample,sceneLoadMs:r.runtime.sceneLoadMs}};
});
const mobileRepeat=['baseline','candidate'].map(variant=>{
 const r=read('docs/quality-v2/library-r11-mobile-repeat-'+variant+'/browser-results.json').results[0];
 assert.equal(r.width,390);assert.equal(r.pose,'r11-south-front');assert.equal(r.frameSample.timedOut,false);assert.equal(r.frameSample.freshFrames,120);
 return {variant,gpu:r.gpu,sample:r.frameSample,sceneLoadMs:r.runtime.sceneLoadMs};
});
const summary={baseCommit:'3617013',researchCommit:'506052b',method:'Production builds; identical fixed cameras and CSS viewports; sequential separate Edge sessions; DPR 1',
 sourceReports:{before:['library-r11-baseline-production/browser-results.json','library-r11-oblique-baseline-review/browser-results.json'],after:['library-r11-validated/browser-results.json'],steady:['library-r11-fresh-baseline/browser-results.json','library-r11-fresh-validated/browser-results.json'],repeat:['library-r11-mobile-repeat-baseline/browser-results.json','library-r11-mobile-repeat-candidate/browser-results.json']},
 testedAt:new Date().toISOString(),geometry:read('docs/quality-v2/library-r11/geometry-verification.json'),comparisons,freshFrameComparisons,mobileRepeat,
 performanceStatus:'OPEN: 390px south-front steady sample is slower in this final run and confirmation; reduced draw calls do not prove higher FPS',
 bundles:{before:bundle('dist-r11-baseline'),after:bundle('dist-r11-library')},
 physicalClick:after.results.find(r=>r.libraryClick)?.libraryClick,
 limitations:['Not iPhone Safari or phone GPU evidence','FPS is Edge headless and refresh-capped; the 120 fresh RAF samples are the steady measurement, not the earlier initialization-polluted sliding window','390px south-front candidate measured about 23fps vs baseline 25.6fps, with confirmation about 23.4 vs 28.2; mobile performance remains an open qualification item','Local cold scene initialization remains about 12-13 seconds in the fresh comparison; this is not public-network loading performance','GPU memory was not directly measured; renderer textures and geometry counts are resource proxies only','Legacy per-library subset adds the generic clock plane: two triangles, one material and one texture; counts are not per-object GPU memory','The earlier close oblique crops the library on 390px; the appended wide oblique is the whole-building framing check','No external model binary: the new geometry is generated at runtime from retained OSM coordinates']};
fs.writeFileSync(path.join(output,'performance-comparison.json'),JSON.stringify(summary,null,2)+'\n');

// A real unified diff, checked against unchanged world.js without applying it.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'xjtu-r11-world-patch-')),
 source=fs.readFileSync(path.join(root,'src/world.js'),'utf8').replaceAll('\r\n','\n');
const first=path.join(temp,'before.js'),second=path.join(temp,'after.js');fs.writeFileSync(first,source);fs.writeFileSync(second,integrateLibraryWorld(source));
const diff=spawnSync('git',['diff','--no-index','--',first,second],{encoding:'utf8',windowsHide:true});assert.equal(diff.status,1,'Expected a non-empty integration diff');
const patch=diff.stdout.split('\n').map(line=>line.startsWith('diff --git ')?'diff --git a/src/world.js b/src/world.js':line.startsWith('--- ')?'--- a/src/world.js':line.startsWith('+++ ')?'+++ b/src/world.js':line).join('\n');
const patchFile=path.join(output,'world-integration.patch');fs.writeFileSync(patchFile,patch);
const check=spawnSync('git',['apply','--check',patchFile],{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(check.status,0,check.stderr);
const south=comparisons.find(c=>c.pose==='r11-south-front'&&c.width===1440);
console.log(JSON.stringify({pairedViews:comparisons.length,south,jsBytes:summary.bundles.before.bytes+' -> '+summary.bundles.after.bytes,jsGzip:summary.bundles.before.gzipBytes+' -> '+summary.bundles.after.gzipBytes,patchCheckPassed:true}));
