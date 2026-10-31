import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../',import.meta.url);
test('R17 atlas links into the isolated game lab without absolute-host paths',()=>{
 const atlas=fs.readFileSync(new URL('index.html',root),'utf8');
 const lab=fs.readFileSync(new URL('r17-lab.html',root),'utf8');
 assert.match(atlas,/<nav[^>]+aria-label="网站工具"[^>]*>[\s\S]*?<a[^>]+id="r17-lab-link"[^>]+href="\.\/r17-lab\.html"/);
 assert.match(atlas,/id="r17-lab-link"[^>]+aria-label="进入独立的 R17 赛车与靶场实验室"/);
 assert.match(atlas,/id="r17-lab-link"[^>]*white-space:nowrap/);
 assert.match(lab,/href="\.\/index\.html"/);
});
