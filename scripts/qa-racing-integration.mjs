import {chromium} from 'playwright-core'
import {mkdir,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const browser=await chromium.launch({
 executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 headless:true,args:['--use-gl=angle','--enable-webgl']
})
const base=process.env.CAMPUS_QA_URL||'http://127.0.0.1:18986/'
const folder='docs/quality-v2/r17-racing-qa'
await mkdir(folder,{recursive:true})
const reports=[]
const diag=page=>page.evaluate(()=>window.__atlasRacingDiagnostics)
const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const point=async(page,sel,dx=0)=>{
 const rect=await page.locator(sel).boundingBox()
 assert.ok(rect,'control exists '+sel)
 return {x:rect.x+rect.width*(.5+dx),y:rect.y+rect.height*.5}
}
async function testProfile(cfg){
 const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},deviceScaleFactor:cfg.touch?2:1,isMobile:cfg.touch,hasTouch:cfg.touch})
 const page=await context.newPage()
 const errors=[],httpErrors=[]
 page.on('pageerror',e=>errors.push(e.message))
 page.on('console',e=>{if(e.type()==='error')errors.push('console '+e.text())})
 page.on('response',res=>{if(res.status()>=400)httpErrors.push(res.status()+' '+res.url())})
 const result={profile:cfg.name,viewport:[cfg.width,cfg.height],steps:[]}
 try{
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000})
  await page.waitForFunction(()=>window.__campusReady===true,null,{timeout:30000})
  const original=await page.evaluate(()=>window.campusDiagnostics())
  assert.ok(original.buildings>100&&original.drawCalls>0,'original campus rendered')
  const entry=page.locator('#race-entry-btn')
  assert.equal(await entry.count(),1,'one entry button')
  await page.screenshot({path:folder+'/'+cfg.name+'-campus.png'})
  const initialRequests=await page.evaluate(()=>performance.getEntriesByType('resource').filter(x=>/racing-mode|race\\.glb|cannon/.test(x.name)).length)
  assert.equal(initialRequests,0,'no car resources loaded on initial campus page')
  for(let round=0;round<(cfg.touch?2:3);round++){
   await entry.click()
   await page.waitForFunction(()=>document.body.classList.contains('racing-mode')&&window.__atlasRacingDiagnostics?.contacts>=2,null,{timeout:20000})
   const beginning=await diag(page)
   assert.ok(beginning.bodies>10&&beginning.contacts>=2,'real Cannon contacts and static colliders')
   assert.equal(beginning.visualWheels,4,'Kenney wheels rendered')
   assert.ok(beginning.position[0]>1700&&beginning.position[2]>1700,'synthetic road isolated from campus')
   if(round===0){
    await page.screenshot({path:folder+'/'+cfg.name+'-racing.png'})
    if(cfg.touch){
     const cdp=await context.newCDPSession(page)
     const steer=await point(page,'#race-stick',.18)
     const gas=await point(page,'#race-gas')
     await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...steer,id:1},{...gas,id:2}]})
     await sleep(1500)
     const going=await diag(page)
     assert.ok(going.speedKmh>0.5,'multitouch steering and throttle move real vehicle')
     assert.ok(Math.hypot(going.position[0]-beginning.position[0],going.position[2]-beginning.position[2])>.2,'vehicle moves physically')
     await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
     await page.locator('#race-reset').click()
     await sleep(200)
     const reverse=await point(page,'#race-reverse')
     await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...reverse,id:3}]})
     await sleep(1500)
     const backwards=await diag(page)
     await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
     assert.ok(backwards.position[2]<beginning.position[2]-.1,'mobile reverse moves backwards')
     result.steps.push({multitouchSpeedKmh:going.speedKmh,reverseDisplacement:backwards.position[2]-beginning.position[2]})
    }else{
     await page.keyboard.down('w')
     await sleep(1650)
     const going=await diag(page)
     await page.keyboard.up('w')
     assert.ok(going.speedKmh>0.5,'keyboard gas generates speed')
     assert.ok(going.position[2]>beginning.position[2]+.2,'vehicle accelerates forward')
     await page.keyboard.press('c')
     await page.keyboard.press('r')
     await sleep(200)
     const reset=await diag(page)
     assert.ok(Math.abs(reset.position[2]-1782)<3,'R chassis reset on track')
     result.steps.push({keyboardSpeedKmh:going.speedKmh,resetPosition:reset.position})
    }
   }
   await page.locator('#race-exit').click()
   await page.waitForFunction(()=>!document.body.classList.contains('racing-mode')&&!window.__atlasRacingDiagnostics,null,{timeout:7000})
   const restored=await page.evaluate(()=>window.campusDiagnostics())
   assert.ok(Math.hypot(...original.camera.map((v,i)=>v-restored.camera[i]))<3,'camera restored with no reload')
   assert.equal(restored.mode,original.mode,'original explore or walk mode restored')
   assert.equal(await page.locator('#racing-overlay').count(),0,'no retained racing HUD')
   await sleep(200)
  }
  await page.screenshot({path:folder+'/'+cfg.name+'-returned.png'})
  assert.deepEqual(httpErrors,[],'assets no 404')
  assert.deepEqual(errors,[],'no browser JS errors')
  result.passed=true;result.errors=errors;result.httpErrors=httpErrors
 }catch(err){result.passed=false;result.failure=String(err);result.errors=errors;result.httpErrors=httpErrors;try{await page.screenshot({path:folder+'/'+cfg.name+'-failure.png'})}catch{}}
 finally{await context.close()}
 return result
}
try{
 for(const cfg of [
  {name:'desktop-1440',width:1440,height:900,touch:false},
  {name:'portrait-390',width:390,height:844,touch:true},
  {name:'landscape-844',width:844,height:390,touch:true}
 ]){const result=await testProfile(cfg);reports.push(result);console.log(JSON.stringify(result))}
 await writeFile(folder+'/browser-results.json',JSON.stringify({date:new Date().toISOString(),base,results:reports},null,2))
 if(reports.some(x=>!x.passed))process.exitCode=1
}finally{await browser.close()}
