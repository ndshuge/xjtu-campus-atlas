import {chromium} from 'playwright-core'
import {mkdir,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const output=process.env.CAMPUS_QA_OUTPUT||'docs/quality-v2/r18-campus-qa'
const url=process.env.CAMPUS_QA_URL||'http://127.0.0.1:18987/'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({
 executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 headless:true,
 args:['--use-gl=angle','--enable-webgl'],
 proxy:process.env.CAMPUS_QA_PROXY?{server:process.env.CAMPUS_QA_PROXY}:undefined
})
const results=[]
const state=page=>page.evaluate(()=>window.__atlasRacingDiagnostics)
async function pos(page,selector,scale=0){
 const box=await page.locator(selector).boundingBox()
 assert.ok(box,'control exists: '+selector)
 return {x:box.x+box.width*(.5+scale),y:box.y+box.height*.5}
}
async function profile({name,width,height,touch}){
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:touch?2:1,isMobile:touch,hasTouch:touch})
 const page=await ctx.newPage()
 const errors=[],httpErrors=[]
 page.on('pageerror',e=>errors.push(e.message))
 page.on('console',e=>{if(e.type()==='error')errors.push('console '+e.text())})
 page.on('response',r=>{if(r.status()>=400)httpErrors.push(r.status()+' '+r.url())})
 const report={name,viewport:[width,height],actions:[]}
 try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000})
  await page.waitForFunction(()=>window.__campusReady===true,null,{timeout:45000})
  const before=await page.evaluate(()=>window.campusDiagnostics())
  assert.ok(before.buildings>50&&before.drawCalls>0,'original campus has real scene and draw calls')
  assert.equal(await page.locator('#race-entry-btn').count(),1)
  assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').filter(x=>/racing-mode|race\\.glb/.test(x.name)).length),0,'original map must not download race')
  await page.screenshot({path:output+'/'+name+'-campus.png'})
  for(let cycle=0;cycle<2;cycle++){
   await page.locator('#race-entry-btn').click()
   await page.waitForFunction(()=>window.__atlasRacingDiagnostics?.arena==='campus' && window.__atlasRacingDiagnostics?.contacts>=2,null,{timeout:25000})
   const start=await state(page)
   assert.equal(start.routeId,'way/148313517/0')
   assert.ok(start.position[0]>118&&start.position[0]<127&&start.position[2]>-70&&start.position[2]<40,'car physically on mapped avenue')
   assert.ok(start.collisionStats.roadSlabs>=10&&start.collisionStats.buildingEdges>10,'road and building colliders installed')
   assert.ok(start.worldCamera[0]<400,'camera is within campus map instead of synthetic 1800')
   if(cycle===0){
    await page.screenshot({path:output+'/'+name+'-campus-driving.png'})
    if(touch){
     const cdp=await ctx.newCDPSession(page)
     const stick=await pos(page,'#race-stick',.18),gas=await pos(page,'#race-gas')
     await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...stick,id:1},{...gas,id:2}]})
     await page.waitForTimeout(1400)
     const after=await state(page)
     assert.ok(after.speedKmh>1,'multitouch gas causes actual physics acceleration')
     assert.ok(after.position[2]<start.position[2]-.2,'actual campus avenue moves south')
     await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
     await page.locator('#race-reset').click()
     await page.waitForTimeout(260)
     const reverse=await pos(page,'#race-reverse')
     await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...reverse,id:3}]})
     await page.waitForTimeout(1350)
     const backwards=await state(page)
     await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
     assert.ok(backwards.position[2]>start.position[2]+.12,'actual reverse on south-facing road moves north')
     report.actions.push({southbound:after.position[2]-start.position[2],speedKmh:after.speedKmh,reverse:backwards.position[2]-start.position[2]})
    }else{
     await page.keyboard.down('w')
     await page.waitForTimeout(1500)
     const after=await state(page)
     await page.keyboard.up('w')
     assert.ok(after.speedKmh>1&&after.position[2]<start.position[2]-.25,'keyboard accelerates south along mapped road')
     await page.keyboard.down('Space')
     await page.waitForTimeout(750)
     const braking=await state(page)
     await page.keyboard.up('Space')
     await page.keyboard.press('r')
     await page.waitForTimeout(200)
     const reset=await state(page)
     assert.ok(Math.abs(reset.position[2]-start.position[2])<2,'vehicle resets to campus street '+JSON.stringify({start:start.position,after:after.position,reset:reset.position,active:await page.evaluate(()=>({id:document.activeElement?.id,tag:document.activeElement?.tagName}))}))
     // Regression: R should work repeatedly after other key controls and camera focus changes.
     for(let i=0;i<5;i++){
      await page.keyboard.down('w')
      await page.waitForTimeout(150)
      await page.keyboard.up('w')
      await page.keyboard.press('r')
      await page.waitForTimeout(90)
      const stressed=await state(page)
      assert.ok(Math.abs(stressed.position[2]-start.position[2])<1.4,'repeat R reset '+i+' '+JSON.stringify(stressed.position))
     }
     report.actions.push({southbound:after.position[2]-start.position[2],speedKmh:after.speedKmh,handbrakeSpeedKmh:braking.speedKmh,resetStress:5})
    }
    await page.locator('#race-switch').click()
    await page.waitForFunction(()=>window.__atlasRacingDiagnostics?.arena==='practice',null,{timeout:22000})
    const practice=await state(page)
    assert.ok(practice.position[0]>1700,'old synthetic arena remains optional')
    await page.locator('#race-switch').click()
    await page.waitForFunction(()=>window.__atlasRacingDiagnostics?.arena==='campus',null,{timeout:22000})
    const returned=await state(page)
    assert.ok(returned.position[0]<400,'switching back returns to actual campus road')
   }
   await page.locator('#race-exit').click()
   await page.waitForFunction(()=>!document.body.classList.contains('racing-mode')&&!window.__atlasRacingDiagnostics,null,{timeout:8000})
   const back=await page.evaluate(()=>window.campusDiagnostics())
   const delta=Math.hypot(...before.camera.map((v,i)=>v-back.camera[i]))
   assert.ok(delta<3,'Atlas camera restored without page reload')
   assert.equal(back.mode,before.mode,'original map mode restored')
   assert.equal(await page.locator('#racing-overlay').count(),0,'HUD disposed')
   await page.waitForTimeout(180)
  }
  await page.screenshot({path:output+'/'+name+'-returned.png'})
  assert.deepEqual(errors,[],'no JS errors');assert.deepEqual(httpErrors,[],'no HTTP errors')
  report.ok=true;report.errors=[];report.httpErrors=[]
 }catch(e){report.ok=false;report.reason=String(e);report.errors=errors;report.httpErrors=httpErrors;try{await page.screenshot({path:output+'/'+name+'-failed.png'})}catch{}}
 finally{await ctx.close()}
 return report
}
try{
 for(const cfg of [{name:'desktop-1440',width:1440,height:900,touch:false},{name:'portrait-390',width:390,height:844,touch:true},{name:'landscape-844',width:844,height:390,touch:true}]){
  if(process.env.CAMPUS_QA_PROFILE&&cfg.name!==process.env.CAMPUS_QA_PROFILE)continue
  const r=await profile(cfg);results.push(r);console.log(JSON.stringify(r))
 }
 await writeFile(output+'/results.json',JSON.stringify({date:new Date().toISOString(),url,results},null,2))
 if(results.some(r=>!r.ok))process.exitCode=1
}finally{await browser.close()}
