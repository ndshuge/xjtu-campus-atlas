import {chromium} from 'playwright-core'
import {mkdir,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const base=process.env.CAMPUS_QA_URL||'http://127.0.0.1:19023/'
const out=process.env.CAMPUS_QA_OUTPUT||'docs/quality-v2/r23-campus-spawn-qa'
await mkdir(out,{recursive:true})
const browser=await chromium.launch({
 executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
 headless:true,args:['--use-gl=angle','--enable-webgl'],
 proxy:process.env.CAMPUS_QA_PROXY?{server:process.env.CAMPUS_QA_PROXY}:undefined
})
const profiles=[
 {name:'desktop-1440',width:1440,height:900,touch:false},
 {name:'portrait-390',width:390,height:844,touch:true},
 {name:'landscape-844',width:844,height:390,touch:true}
]
const roads=['way/148313517/0','way/263483674/0','way/148313518/0','way/148313743/0','way/148313744/0','way/263483675/0']
const results=[]
try{
 for(const cfg of profiles){
  const context=await browser.newContext({
   viewport:{width:cfg.width,height:cfg.height},isMobile:cfg.touch,
   hasTouch:cfg.touch,deviceScaleFactor:cfg.touch?2:1
  })
  const page=await context.newPage(),errors=[],http=[]
  page.on('pageerror',e=>errors.push(e.message))
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  page.on('response',r=>{if(r.status()>=400)http.push(r.status()+': '+r.url())})
  const report={name:cfg.name,roads:[],errors,http}
  try{
   await page.goto(base+'?drive=1',{waitUntil:'domcontentloaded',timeout:32000})
   await page.waitForFunction(()=>window.__atlasRacingDiagnostics?.contacts>=2,null,{timeout:40000})
   assert.equal(await page.locator('#race-road option').count(),7,'six roads + athletics field')
   for(const id of roads){
    await page.locator('#race-road').selectOption(id,{timeout:8000})
    await page.waitForFunction(expected=>
     window.__atlasRacingDiagnostics?.routeId===expected&&
     window.__atlasRacingDiagnostics?.contacts>=2&&
     window.__atlasRacingDiagnostics?.surfaceZone==='campus',id,{timeout:23000})
    const race=await page.evaluate(()=>window.__atlasRacingDiagnostics)
    assert.ok(race.collisionStats.terrainBodies===1,'single terrain ground')
    assert.ok(race.collisionStats.activeBodies<350,'streamed local colliders')
    report.roads.push({id,position:race.position,contacts:race.contacts,roadName:race.roadName})
    if(id==='way/148313518/0'){
     assert.ok(race.position[0]>-401,'Wenzhi starting point is inside campus')
     await page.screenshot({path:out+'/'+cfg.name+'-wenzhi.png'})
     if(cfg.touch){
      const box=await page.locator('#race-gas').boundingBox()
      assert.ok(box,'touch gas visible')
      const cdp=await context.newCDPSession(page)
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:1}]})
      await page.waitForTimeout(1150)
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
     }else{
      await page.keyboard.down('w')
      await page.waitForTimeout(1150)
      await page.keyboard.up('w')
     }
     const moved=await page.evaluate(()=>window.__atlasRacingDiagnostics)
     assert.ok(moved.speedKmh>1,'Wenzhi vehicle accelerates')
     assert.equal(moved.surfaceZone,'campus')
     report.wenzhiSpeed=moved.speedKmh
    }
   }
   await page.locator('#race-road').selectOption('area:east-stadium')
   await page.waitForFunction(()=>window.__atlasRacingDiagnostics?.routeId==='area:east-stadium'&&window.__atlasRacingDiagnostics?.contacts>=2,null,{timeout:22000})
   assert.equal((await page.evaluate(()=>window.__atlasRacingDiagnostics)).surfaceZone,'campus')
   await page.locator('#race-exit').click()
   await page.waitForFunction(()=>!window.__atlasRacingDiagnostics,null,{timeout:9000})
   assert.deepEqual(errors,[])
   assert.deepEqual(http,[])
   report.pass=true
  }catch(e){report.pass=false;report.error=String(e);try{await page.screenshot({path:out+'/'+cfg.name+'-failed.png'})}catch{}}
  results.push(report);console.log(JSON.stringify(report))
  await context.close()
 }
 await writeFile(out+'/results.json',JSON.stringify({base,date:new Date().toISOString(),results},null,2))
 if(results.some(x=>!x.pass))process.exitCode=1
}finally{await browser.close()}
