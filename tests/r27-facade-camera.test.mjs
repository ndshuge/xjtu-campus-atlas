import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {planBuildingCloseView} from '../src/building-near-camera.js'
import {createPhotoBuildingAssets,createPhotoBuildingEntranceOverlays} from '../src/photo-building-integration.js'
const campus=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'))
test('R27 photo facades produce camera eyes on their evidenced frontage',()=>{
 const masses=createPhotoBuildingAssets({buildings:campus.buildings})
 const doors=createPhotoBuildingEntranceOverlays({buildings:campus.buildings})
 try{
  for(const [id,asset] of [[263633887,masses.children.find(x=>x.userData.osmIds.includes(263633887))],
   [263625677,doors.children[0]]]){
   assert.ok(asset)
   const face=asset.userData.front||asset.userData.face
   assert.ok(face?.center&&face?.normal,'a photo-focused asset must declare its facade')
   const building=campus.buildings.find(x=>x.osmId===id)
   const currentEye=[building.center[0]-200,160,building.center[1]+200]
   const frame=planBuildingCloseView({building,currentEye,preferredFace:face,viewport:{width:1440,height:900},baseY:1.1})
   assert.ok(frame,'valid face should be frameable')
   assert.ok(Math.hypot(frame.target[0]-face.center[0],frame.target[2]-face.center[2])<3,'orbit target should point to photo reference entrance')
   const vx=frame.position[0]-frame.target[0],vz=frame.position[2]-frame.target[2]
   const dot=vx*face.normal[0]+vz*face.normal[1]
   assert.ok(dot/Math.hypot(vx,vz)>.87,'camera must look toward documented facade rather than the old camera direction')
   assert.ok(frame.distance>=38&&frame.distance<=150)
  }
 }finally{masses.dispose();doors.dispose()}
})
test('R27 public near-view handler uses photo-facing metadata only when supplied',()=>{
 const src=readFileSync(new URL('../src/world.js',import.meta.url),'utf8')
 assert.ok(src.includes('preferredFace:'))
 assert.ok(src.includes('this.photoEntranceOverlays?.children'))
 assert.ok(src.includes('this.photoBuildingAssets?.children'))
})
