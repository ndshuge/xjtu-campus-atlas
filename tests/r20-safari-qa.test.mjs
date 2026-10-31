import test from 'node:test'
import assert from 'node:assert/strict'
import {createMobileQaSession,identifySafariPlatform} from '../src/racing/safari-qa.js'
test('explicit Safari diagnostic session starts with UNVERIFIED even when UA resembles iPhone',()=>{
 const ios='Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1'
 assert.equal(identifySafariPlatform(ios),'ios-safari-ua')
 assert.equal(identifySafariPlatform('Mozilla/5.0 (iPhone) AppleWebKit CriOS/130.0 Mobile Safari/604.1'),'ios-other-browser-ua')
 assert.equal(identifySafariPlatform('Mozilla/5.0 Windows Chrome/140'),'other')
 const session=createMobileQaSession({now:()=>1000,userAgent:ios})
 assert.equal(session.report().verification,'UNVERIFIED_NEEDS_DEVICE_REVIEW')
 assert.equal(session.report().samples.length,0)
})
test('recorder logs physics, touch overlap, interruptions and remains manual-review-only',()=>{
 let time=1000
 const session=createMobileQaSession({now:()=>time,userAgent:'iPhone AppleWebKit Version/26 Mobile Safari'})
 session.start()
 session.pointer('down','race-stick',1)
 session.pointer('down','race-gas',2)
 session.sample({fps:48,arena:'campus',speedKmh:27,contacts:4,roadName:'梧桐东道',canvasPixels:700000,width:390,height:844})
 session.pointer('cancel','race-stick',1)
 session.pointer('up','race-gas',2)
 session.visibility('hidden')
 time+=1500
 session.sample({fps:0,arena:'none',width:844,height:390,canvasPixels:700000})
 session.stop()
 const out=session.report()
 assert.equal(out.touch.maxConcurrent,2)
 assert.equal(out.touch.cancels,1)
 assert.equal(out.samples.length,2)
 assert.equal(out.samples[0].speedKmh,27)
 assert.equal(out.events.at(-1).type,'visibility')
 assert.equal(out.verification,'UNVERIFIED_NEEDS_DEVICE_REVIEW')
 assert.deepEqual([...new Set(out.samples.map(s=>s.orientation))].sort(),['landscape','portrait'])
 assert.equal(JSON.stringify(out).includes('password'),false)
})
test('session limits diagnostic data growth and never self-certifies Safari',()=>{
 let tick=0
 const session=createMobileQaSession({now:()=>tick++,userAgent:'Chrome Windows'})
 session.start()
 for(let i=0;i<2500;i++){session.sample({fps:60,arena:'campus',speedKmh:i%50});session.pointer('down','race-gas',i)}
 session.stop()
 assert.ok(session.report().samples.length<=900)
 assert.ok(session.report().events.length<=350)
 assert.equal(session.report().platform,'other')
 assert.equal(session.report().verification,'UNVERIFIED_NEEDS_DEVICE_REVIEW')
})
