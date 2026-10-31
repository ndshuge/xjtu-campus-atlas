import {chromium} from 'playwright-core'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const folder=process.env.CAMPUS_QA_OUTPUT||'docs/quality-v2/r20-safari-panel-qa'
const url=process.env.CAMPUS_QA_URL||'http://127.0.0.1:18989/'
await mkdir(folder,{recursive:true})
const browser=await chromium.launch({
 executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 headless:true,args:['--use-gl=angle','--enable-webgl'],
 proxy:process.env.CAMPUS_QA_PROXY?{server:process.env.CAMPUS_QA_PROXY}:undefined
})
const result={url,environment:'Edge mobile emulation, NOT an actual iPhone Safari',steps:[],errors:[]}
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2,acceptDownloads:true})
const page=await context.newPage()
page.on('pageerror',e=>result.errors.push(e.message))
page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text())})
const point=async(selector,dx=0)=>{
 const box=await page.locator(selector).boundingBox()
 assert.ok(box,selector+' missing')
 return {x:box.x+box.width*(.5+dx),y:box.y+box.height*.5}
}
try{
 await page.goto(url+'?safariQa=1',{waitUntil:'domcontentloaded',timeout:30000})
 await page.waitForFunction(()=>window.__campusReady===true,null,{timeout:40000})
 await page.locator('#safari-qa-root summary').waitFor({state:'visible',timeout:20000})
 assert.equal(await page.locator('#safari-qa-root').count(),1)
 await page.locator('#safari-qa-root summary').click()
 await page.locator('#safari-qa-start').click()
 result.steps.push('opt-in-device-panel-running')
 await page.locator('#safari-qa-root summary').click()
 await page.locator('#race-entry-btn').click()
 await page.waitForFunction(()=>window.__atlasRacingDiagnostics?.contacts>=2,null,{timeout:25000})
 const diag=await page.evaluate(()=>window.__atlasRacingDiagnostics)
 assert.equal(diag.networkRoads,110)
 assert.ok(diag.collisionStats.junctionPads>0,'stream has some shared-vertex support pads')
 result.steps.push({junctionPads:diag.collisionStats.junctionPads,roadSlabs:diag.collisionStats.roadSlabs})
 const cdp=await context.newCDPSession(page)
 const stick=await point('#race-stick',.16),gas=await point('#race-gas')
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...stick,id:1},{...gas,id:2}]})
 await page.waitForTimeout(1300)
 const accelerated=await page.evaluate(()=>window.__atlasRacingDiagnostics)
 assert.ok(accelerated.speedKmh>1,'real physics acceleration')
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]})
 await page.waitForTimeout(700)
 result.steps.push({physicsSpeedKmh:accelerated.speedKmh})
 await page.locator('#race-exit').click()
 await page.waitForFunction(()=>!window.__atlasRacingDiagnostics,null,{timeout:10000})
 await page.locator('#safari-qa-root summary').click()
 await page.locator('#safari-qa-stop').click()
 await page.screenshot({path:folder+'/device-panel.png'})
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#safari-qa-export').click()])
 const downloadPath=await download.path()
 const report=JSON.parse(await readFile(downloadPath,'utf8'))
 assert.equal(report.schema,'atlas-r20-device-qa-v1')
 assert.equal(report.verification,'UNVERIFIED_NEEDS_DEVICE_REVIEW')
 assert.equal(report.platform,'other','must not misrepresent Edge as iOS Safari')
 assert.ok(report.samples.some(s=>s.arena==='campus'&&s.contacts>=2))
 assert.ok(report.touch.maxConcurrent>=2,'QA reports real simultaneous pointer events')
 assert.ok(report.touch.cancels>=1,'QA reports pointer cancellation')
 assert.ok(report.samples.length>=2)
 result.steps.push({samples:report.samples.length,touch:report.touch,verification:report.verification})
 await writeFile(folder+'/edge-emulation-export.json',JSON.stringify(report,null,2))
 result.pass=result.errors.length===0
}catch(e){result.pass=false;result.failure=String(e);try{await page.screenshot({path:folder+'/failure.png'})}catch{}}
finally{await writeFile(folder+'/results.json',JSON.stringify(result,null,2));await context.close();await browser.close()}
console.log(JSON.stringify(result))
if(!result.pass)process.exitCode=1
