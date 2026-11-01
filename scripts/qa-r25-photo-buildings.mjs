import {chromium} from 'playwright-core'
import {mkdir,writeFile,readFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const site=process.env.CAMPUS_QA_URL||'http://127.0.0.1:19025/'
const dir=process.env.CAMPUS_QA_OUTPUT||'docs/quality-v2/r25-math-sports-qa'
const campus=JSON.parse(await readFile(new URL('../public/data/campus.json',import.meta.url),'utf8'))
const buildings=[263625090,264108763,263808679].map(id=>campus.buildings.find(b=>b.osmId===id))
assert.ok(buildings.every(Boolean))
await mkdir(dir,{recursive:true})
const browser=await chromium.launch({
 executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 headless:true,args:['--use-gl=angle','--enable-webgl'],
 proxy:process.env.CAMPUS_QA_PROXY?{server:process.env.CAMPUS_QA_PROXY}:undefined
})
const profiles=[
 {name:'desktop',width:1440,height:900,touch:false},
 {name:'portrait-390',width:390,height:844,touch:true},
 {name:'landscape-844',width:844,height:390,touch:true}
]
const results=[]
try{
 for(const cfg of profiles){
  const ctx=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},isMobile:cfg.touch,hasTouch:cfg.touch,deviceScaleFactor:cfg.touch?2:1})
  const page=await ctx.newPage(),errors=[],http=[]
  page.on('pageerror',e=>errors.push(e.message))
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  page.on('response',r=>{if(r.status()>=400)http.push(r.status()+': '+r.url())})
  const result={name:cfg.name,buildings:[],errors,http}
  try{
   for(const building of buildings){
    await page.goto(site+'?photoQa='+building.osmId+'#'+encodeURIComponent(building.id),{waitUntil:'domcontentloaded',timeout:32000})
    await page.waitForFunction(()=>window.__campusReady===true,null,{timeout:42000})
    await page.waitForTimeout(1600)
    const d=await page.evaluate(()=>window.campusDiagnostics())
    assert.equal(d.photoBuildingCount,11)
    assert.equal(await page.locator('#detail').isVisible(),true,'building detail must render')
    assert.equal((await page.locator('#detail-body h2').innerText()).trim(),building.name.trim(),'correct source OSM building detail is selected')
    assert.deepEqual(errors,[],'no script errors')
    assert.deepEqual(http,[],'no missing assets')
    await page.screenshot({path:dir+'/'+cfg.name+'-'+building.osmId+'.png'})
    result.buildings.push({id:building.osmId,name:building.name,drawCalls:d.drawCalls,photoBuildingCount:d.photoBuildingCount})
   }
   await page.goto(site+'?drive=1',{waitUntil:'domcontentloaded',timeout:30000})
   await page.waitForFunction(()=>window.__atlasRacingDiagnostics?.contacts>=2,null,{timeout:35000})
   assert.equal((await page.evaluate(()=>window.__atlasRacingDiagnostics)).arena,'campus')
   await page.locator('#race-exit').click()
   await page.waitForFunction(()=>!window.__atlasRacingDiagnostics,null,{timeout:10000})
   assert.deepEqual(errors,[])
   assert.deepEqual(http,[])
   result.passed=true
  }catch(e){result.passed=false;result.failure=String(e);try{await page.screenshot({path:dir+'/'+cfg.name+'-failed.png'})}catch{}}
  console.log(JSON.stringify(result))
  results.push(result)
  await ctx.close()
 }
 await writeFile(dir+'/results.json',JSON.stringify({site,date:new Date().toISOString(),results},null,2))
 if(results.some(x=>!x.passed))process.exitCode=1
}finally{await browser.close()}
