import {chromium} from 'playwright-core'
import {readFile,mkdir,writeFile} from 'node:fs/promises'
const data=JSON.parse(await readFile('public/data/campus.json','utf8'))
const dir='docs/quality-v2/r29-facade-angle-qa'
await mkdir(dir,{recursive:true})
const browser=await chromium.launch({executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',headless:true,args:['--use-gl=angle','--enable-webgl']})
const page=await browser.newPage({viewport:{width:1440,height:900}})
const results=[],errors=[]
page.on('pageerror',e=>errors.push(e.message))
try{
 for(const id of [263633887,263625677]){
  const record=data.buildings.find(b=>b.osmId===id)
  await page.goto('http://127.0.0.1:19029/?photoQa='+id+'#'+encodeURIComponent(record.id),{waitUntil:'domcontentloaded',timeout:30000})
  await page.waitForFunction(()=>window.__campusReady===true&&window.campusDiagnostics().cameraFlight===false,null,{timeout:38000})
  await page.locator('#detail .detail-actions button.primary').click()
  await page.waitForFunction(()=>window.campusDiagnostics().cameraFlight===false,null,{timeout:20000})
  await page.waitForTimeout(170)
  const d=await page.evaluate(()=>window.campusDiagnostics())
  const dy=d.camera[1]-d.target[1],dx=d.camera[0]-d.target[0],dz=d.camera[2]-d.target[2]
  const pitch=Math.atan2(dy,Math.hypot(dx,dz))
  await page.screenshot({path:dir+'/'+id+'.png'})
  results.push({id,name:record.name,pitchRad:pitch,distance:Math.hypot(dx,dz,dy),errors:[...errors]})
  console.log(JSON.stringify(results.at(-1)))
 }
 await writeFile(dir+'/results.json',JSON.stringify(results,null,2))
}finally{await browser.close()}
if(results.some(r=>r.pitchRad>.46||r.distance>133||r.errors.length))process.exitCode=1
