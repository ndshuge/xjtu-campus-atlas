import {chromium} from 'playwright-core'
import {mkdir,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const base=process.env.CAMPUS_QA_URL||'http://127.0.0.1:18998/'
const out=process.env.CAMPUS_QA_OUTPUT||'docs/quality-v2/r21-browser-qa'
await mkdir(out,{recursive:true})
const browser=await chromium.launch({
 executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 headless:true,args:['--use-gl=angle','--enable-webgl'],
 proxy:process.env.CAMPUS_QA_PROXY?{server:process.env.CAMPUS_QA_PROXY}:undefined
})
const profiles=[{n:'desktop-1440',w:1440,h:900,touch:false},{n:'portrait-390',w:390,h:844,touch:true},{n:'landscape-844',w:844,h:390,touch:true}]
const results=[]
const state=p=>p.evaluate(()=>window.__atlasRacingDiagnostics)
try{
 for(const x of profiles){
  const ctx=await browser.newContext({viewport:{width:x.w,height:x.h},hasTouch:x.touch,isMobile:x.touch,deviceScaleFactor:x.touch?2:1})
  const page=await ctx.newPage(),errors=[],http=[]
  page.on('pageerror',e=>errors.push(e.message))
  page.on('console',e=>{if(e.type()==='error')errors.push(e.text())})
  page.on('response',r=>{if(r.status()>=400)http.push(r.status()+':'+r.url())})
  const result={name:x.n}
  try{
   await page.goto(base+'?drive=1',{waitUntil:'domcontentloaded',timeout:30000})
   await page.waitForFunction(()=>window.__atlasRacingDiagnostics?.contacts>=2,null,{timeout:40000})
   let old=await state(page)
   assert.equal(old.arena,'campus')
   assert.equal(old.surfaceZone,'campus')
   assert.ok(old.collisionStats.terrainBodies===1,'terrain added once')
   assert.equal(await page.locator('#race-road option[value="area:east-stadium"]').count(),1)
   await page.locator('#race-road').selectOption('area:east-stadium')
   await page.waitForFunction(()=>window.__atlasRacingDiagnostics?.routeId==='area:east-stadium'&&window.__atlasRacingDiagnostics?.contacts>=2,null,{timeout:22000})
   const initial=await state(page)
   assert.ok(initial.isOffRoad,'stadium centre must be off mapped roads')
   assert.equal(initial.surfaceZone,'campus')
   assert.ok(Math.abs(initial.position[0]-192)<6&&Math.abs(initial.position[2]+68)<8,'vehicle spawns on real OSM pitch')
   assert.equal(initial.collisionStats.terrainBodies,1)
   await page.screenshot({path:out+'/'+x.n+'-offroad-driving.png'})
   if(x.touch){
    const cdp=await ctx.newCDPSession(page)
    async function pos(sel,deltaX=0){
     const box=await page.locator(sel).boundingBox()
     assert.ok(box,sel+' hit target')
     return {x:box.x+box.width*(.5+deltaX),y:box.y+box.height/2}
    }
    const steer=await pos('#race-stick',.15),gas=await pos('#race-gas')
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...steer,id:1},{...gas,id:2}]})
    await page.waitForTimeout(1250)
    const after=await state(page)
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
    assert.ok(after.speedKmh>1,'touch gas accelerates on field')
    assert.ok(Math.hypot(after.position[0]-initial.position[0],after.position[2]-initial.position[2])>.5,'vehicle physically moves on stadium turf')
    result.freeDriveSpeed=after.speedKmh
   }else{
    await page.keyboard.down('w')
    await page.waitForTimeout(1500)
    const after=await state(page)
    await page.keyboard.up('w')
    assert.ok(after.speedKmh>1)
    assert.ok(Math.hypot(after.position[0]-initial.position[0],after.position[2]-initial.position[2])>.5)
    result.freeDriveSpeed=after.speedKmh
   }
   await page.locator('#race-road').selectOption('way/148313517/0')
   await page.waitForFunction(()=>window.__atlasRacingDiagnostics?.routeId==='way/148313517/0'&&window.__atlasRacingDiagnostics?.contacts>=2,null,{timeout:22000})
   const road=await state(page)
   assert.equal(road.collisionStats.terrainBodies,1)
   assert.equal(road.surfaceZone,'campus')
   await page.locator('#race-exit').click()
   await page.waitForFunction(()=>!window.__atlasRacingDiagnostics,null,{timeout:8000})
   assert.equal(errors.length,0,'no JavaScript errors')
   assert.equal(http.length,0,'no asset HTTP errors')
   result.passed=true
   result.terrainBodies=initial.collisionStats.terrainBodies
   result.stadiumStart=initial.position
   result.errors=errors
   result.httpErrors=http
  }catch(e){result.passed=false;result.error=String(e);result.errors=errors;result.httpErrors=http;try{await page.screenshot({path:out+'/'+x.n+'-failed.png'})}catch{}}
  console.log(JSON.stringify(result))
  results.push(result)
  await ctx.close()
 }
 await writeFile(out+'/results.json',JSON.stringify({date:new Date().toISOString(),base,results},null,2))
 if(results.some(x=>!x.passed))process.exitCode=1
}finally{await browser.close()}
