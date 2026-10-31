import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url);
test('isolated game lab has accessible mode controls and restores original map entry',()=>{
 const html=fs.readFileSync(new URL('r17-lab.html',root),'utf8');
 assert.match(html,/<button[^>]+id="mode-explore"/);
 assert.match(html,/<button[^>]+id="mode-race"/);
 assert.match(html,/<button[^>]+id="mode-target"/);
 assert.match(html,/<script type="module" src=".\/src\/r17-lab.js">/);
 assert.match(html,/href=".\/index.html"/);
});
test('lab invokes both isolated prototypes and game mode host',()=>{
 const code=fs.readFileSync(new URL('src/r17-lab.js',root),'utf8');
 assert.match(code,/createGameModeHost/);
 assert.match(code,/createRaceSandbox/);
 assert.match(code,/createTargetPractice/);
 assert.match(code,/createIsolatedLevelPatch/);
});
