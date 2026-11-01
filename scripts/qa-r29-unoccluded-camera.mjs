import {chromium} from 'playwright-core'
import assert from 'node:assert/strict'
import {readFile,mkdir,writeFile} from 'node:fs/promises'
const site=process.env.CAMPUS_QA_URL||'http://127.0.0.1:19029/'
const dir=process.env.CAMPUS_QA_OUTPUT||'docs/quality-v2/r29-unoccluded-camera-qa'
const data=JSON.parse(await readFile(new URL('../public/data/campus.json',import.meta.url),'utf8'))
const profiles=[
 {name:'desktop',width:1440,height:900,touch:false},
 {name:'portrait-390',width:390,height:844,touch:true},
 {name:'landscape-844',width:844,height:390,touch:true}
]
await mkdir(dir,{recursive:true})
const browser=await chromium.launch({
 executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 headless:true,args:['--use-gl=angle','--enable-webgl'],
 proxy:process.env.CAMPUS_QA_PROXY?{server:process.env.CAMPUS_QA_PROXY}:undefined
})
const results=[]
const diagnostics=async page=>page.evaluate(()=>{
 const d=window.campusDiagnostics()
 return {distance:Math.hypot(...d.camera.map((v,i)=>v-d.target[i])),
  camera:d.camera,target:d.target,flight:d.cameraFlight,
  photoCount:d.photoBuildingCount,selected:d.selected,drawCalls:d.drawCalls}
})
try{
 for(const cfg of profiles){
  const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},isMobile:cfg.touch,hasTouch:cfg.touch,deviceScaleFactor:cfg.touch?2:1})
  const page=await context.newPage(),errors=[],http=[]
  page.on('pageerror',e=>errors.push(e.message))
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  page.on('response',r=>{if(r.status()>=400)http.push(r.status()+':'+r.url())})
  const report={name:cfg.name,buildings:[],errors,http}
  try{
   for(const id of [263633887,263625677,263625090]){
    const record=data.buildings.find(b=>b.osmId===id)
    await page.goto(site+'?photoQa='+id+'#'+encodeURIComponent(record.id),{waitUntil:'domcontentloaded',timeout:30000})
    await page.waitForFunction(()=>window.__campusReady===true,null,{timeout:42000})
    await page.waitForFunction(()=>window.campusDiagnostics().cameraFlight===false,null,{timeout:24000})
    await page.waitForTimeout(160)
    const before=await diagnostics(page)
    assert.equal(before.flight,false,'overview animation must be complete')
    assert.equal(before.photoCount,12,'all integrated assets should stay visible')
    if(cfg.touch&&cfg.height>cfg.width){
     const expander=page.locator('#detail-expand')
     if(await expander.isVisible())await expander.click({timeout:8000})
    }
    const btn=page.locator('#detail .detail-actions button.primary')
    assert.ok(await btn.isVisible(),'close-up button must be visible')
    await btn.click({timeout:10000})
    await page.waitForFunction(()=>window.campusDiagnostics().cameraFlight===false,null,{timeout:22000})
    await page.waitForTimeout(120)
    const after=await diagnostics(page)
    assert.equal(after.flight,false,'close-up animation must finish')
    if(cfg.touch&&cfg.height>cfg.width){
     assert.equal(await page.locator('#detail').evaluate(el=>el.classList.contains('expanded')),false,'mobile near action should collapse the detail sheet')
    }
    assert.equal(after.photoCount,12)
    assert.equal(after.selected,record.name)
    assert.ok(after.distance<before.distance*.80,id+' close-up must be >=20% closer than default')
    assert.ok(after.distance>=45&&after.distance<=140,id+' close-up bounded distance')
    const xs=record.points.map(x=>x[0]),zs=record.points.map(x=>x[1])
    const maxFootprint=Math.hypot(Math.max(...xs)-Math.min(...xs),Math.max(...zs)-Math.min(...zs))
    assert.ok(Math.hypot(after.target[0]-record.center[0],after.target[2]-record.center[1])<maxFootprint+.1,'orbit target remains on photographed building, may move to documented facade')
    assert.ok(after.camera[1]>4,'camera remains above terrain')
    await page.screenshot({path:dir+'/'+cfg.name+'-'+id+'.png'})
    report.buildings.push({id,overview:Math.round(before.distance),near:Math.round(after.distance),dropPercent:Math.round(100*(1-after.distance/before.distance)),drawCalls:after.drawCalls})
   }
   assert.deepEqual(errors,[],'JS console must be clean')
   assert.deepEqual(http,[],'HTTP assets must all load')
   await page.goto(site+'?drive=1',{waitUntil:'domcontentloaded',timeout:30000})
   await page.waitForFunction(()=>window.__atlasRacingDiagnostics?.contacts>=2,null,{timeout:35000})
   await page.locator('#race-exit').click()
   await page.waitForFunction(()=>!window.__atlasRacingDiagnostics,null,{timeout:10000})
   assert.deepEqual(errors,[])
   assert.deepEqual(http,[])
   report.passed=true
  }catch(e){report.passed=false;report.error=String(e);try{await page.screenshot({path:dir+'/'+cfg.name+'-failure.png'})}catch{}}
  console.log(JSON.stringify(report))
  results.push(report)
  await context.close()
 }
 await writeFile(dir+'/results.json',JSON.stringify({site,date:new Date().toISOString(),results},null,2))
 if(results.some(r=>!r.passed))process.exitCode=1
}finally{await browser.close()}
