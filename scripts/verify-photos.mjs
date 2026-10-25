import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const project=path.resolve(import.meta.dirname,'..');
const photos=['library-front-2021.jpg','library-aerial-2025.jpg','north-gate-2011.jpg','south-gate-2011.jpg'];
for(const file of photos){
 const src=path.join(project,'public','assets','reference',file);
 const buf=fs.readFileSync(src);
 assert(buf.length>40000&&buf.length<600000,`Unexpected photo size: ${file}`);
 assert(buf[0]===0xff&&buf[1]===0xd8&&buf.at(-2)===0xff&&buf.at(-1)===0xd9,`Invalid JPEG preview: ${file}`);
 const code=fs.readFileSync(path.join(project,'src','app.js'),'utf8');
 assert(code.includes(file),`Photo not linked: ${file}`);
 assert(code.includes('./assets/reference/'),`Missing asset path prefix for ${file}`);
}
const inscription=fs.readFileSync(path.join(project,'public','assets','reference','north-gate-calligraphy-crop.png'));
assert(inscription.length>8000&&inscription[0]===0x89&&inscription.subarray(1,4).toString()==='PNG','Missing real-source north gate inscription crop');
const southCrop=fs.readFileSync(path.join(project,'public','assets','reference','south-gate-signage-crop.png'));
assert(southCrop.length>7000&&southCrop[0]===0x89&&southCrop.subarray(1,4).toString()==='PNG','Missing South Gate photographic facade crop');
const license=fs.readFileSync(path.join(project,'public','assets','reference','README.md'),'utf8');
assert(license.includes('Liuxingy')&&license.includes('https://creativecommons.org/licenses/by-sa/4.0/'),'Library photo attribution is incomplete');
assert(license.includes('IronBlood')&&license.includes('Jucember')&&license.includes('https://creativecommons.org/licenses/by-sa/3.0/'),'Gate photo attribution is incomplete');
assert(license.includes('north-gate-calligraphy-crop.png')&&license.includes('south-gate-signage-crop.png')&&license.includes('adapted derivative'),'Adapted gate textures and share-alike license must be documented');
const html=fs.readFileSync(path.join(project,'index.html'),'utf8');
for(const id of ['detail-peek','detail-photo-shortcut','detail-walk-shortcut','detail-expand','close-detail-mobile'])
 assert(html.includes(id),`Missing interactive mobile UI: ${id}`);
const app=fs.readFileSync(path.join(project,'src','app.js'),'utf8');
for(const name of ['showRealPhoto','setDetailExpanded','appendRealPhotoReference'])
 assert(app.includes(name),`Missing photo UX handler: ${name}`);
console.log(JSON.stringify({passed:true,photos:photos.length,license:'CC BY-SA 4.0',mobileDetailControls:5}));
