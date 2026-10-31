import {chromium} from 'playwright-core'
import {mkdir,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const site=process.env.CAMPUS_SITE_ROOT||'http://127.0.0.1:18990/'
const folder=process.env.CAMPUS_QA_OUTPUT||'docs/quality-v2/r21-homepage-qa'
await mkdir(folder,{recursive:true})
const browser=await chromium.launch({
 executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 headless:true,args:['--use-gl=angle','--enable-webgl'],
 proxy:process.env.CAMPUS_QA_PROXY?{server:process.env.CAMPUS_QA_PROXY}:undefined
})
const results=[]
try{
 for(const cfg of [
  {name:'desktop',width:1440,height:900,mobile:false},
  {name:'phone-portrait',width:390,height:844,mobile:true},
  {name:'phone-landscape',width:844,height:390,mobile:true}
 ]){
  const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},isMobile:cfg.mobile,hasTouch:cfg.mobile,deviceScaleFactor:cfg.mobile?2:1})
  const page=await context.newPage()
  const errors=[],http=[]
  page.on('pageerror',e=>errors.push(e.message))
  page.on('response',r=>{if(r.status()>=400)http.push(r.status()+': '+r.url())})
  const report={name:cfg.name,site}
  try{
   await page.goto(site,{waitUntil:'domcontentloaded',timeout:25000})
   await page.waitForFunction(()=>window.__campusReady===true,null,{timeout:35000})
   const link=page.locator('#atlas-latest-drive-link')
   assert.equal(await link.count(),1,'single homepage racing link')
   assert.ok(await link.isVisible(),'racing CTA visible')
   assert.ok((await link.innerText()).includes('\u8d5b\u8f66'),'link labelled as racing')
   assert.equal(await link.evaluate(e=>e.closest('.toolbar')!==null),true,'racing link integrated into toolbar')
   const box=await link.boundingBox()
   assert.ok(box.x>=0&&box.x+box.width<=cfg.width&&box.y>=0&&box.y+box.height<=cfg.height,'no obstructing or clipped banner')
   assert.notEqual(await link.evaluate(e=>getComputedStyle(e).position),'fixed','not a floating overlay')
   await page.waitForTimeout(550)
   await page.screenshot({path:folder+'/'+cfg.name+'-homepage.png'})
   await link.click({timeout:10000})
   await page.waitForFunction(()=>window.__atlasRacingDiagnostics?.contacts>=2,null,{timeout:30000})
   const race=await page.evaluate(()=>({
    pathname:location.pathname,search:location.search,
    info:window.__atlasRacingDiagnostics
   }))
   assert.ok(race.pathname.includes('r21-campus-free-drive-20261101'),'correct release URL')
   assert.ok(race.search.includes('drive=1'),'direct driving link preserved')
   assert.equal(race.info.arena,'campus')
   assert.equal(race.info.networkRoads,110)
   assert.ok(race.info.collisionStats.junctionPads>=1)
   await page.screenshot({path:folder+'/'+cfg.name+'-autodrive.png'})
   await page.locator('#race-exit').click()
   await page.waitForFunction(()=>!window.__atlasRacingDiagnostics,null,{timeout:9000})
   assert.deepEqual(errors,[],'no JavaScript errors')
   assert.deepEqual(http,[],'no asset HTTP errors')
   report.pass=true
   report.road=race.info.roadName
   report.junctionPads=race.info.collisionStats.junctionPads
   report.errors=errors
   report.httpErrors=http
  }catch(e){report.pass=false;report.error=String(e);report.errors=errors;report.httpErrors=http;try{await page.screenshot({path:folder+'/'+cfg.name+'-failure.png'})}catch{}}
  finally{await context.close()}
  console.log(JSON.stringify(report))
  results.push(report)
 }
 await writeFile(folder+'/results.json',JSON.stringify({site,date:new Date().toISOString(),results},null,2))
 if(results.some(x=>!x.pass))process.exitCode=1
}finally{await browser.close()}
