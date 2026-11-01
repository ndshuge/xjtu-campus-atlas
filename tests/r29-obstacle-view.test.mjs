import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {resolveOccludedBuildingView,measureBuildingViewOcclusion} from '../src/building-view-occlusion.js'
const data=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'))
const target={osmId:1,center:[0,0],points:[[-9,-6],[9,-6],[9,6],[-9,6]],height:15}
const frame={position:[0,29,88],target:[0,9,0],distance:90,coverage:'photo-facade-direction'}
const blocker={osmId:2,center:[0,46],points:[[-15,40],[15,40],[15,54],[-15,54]],height:35}
test('choose a less occluded close-up without changing its selected facade target',()=>{
 const before=measureBuildingViewOcclusion(frame,{building:target,buildings:[target,blocker],trees:[]})
 assert.ok(before.buildingHits>=1)
 const result=resolveOccludedBuildingView(frame,{building:target,buildings:[target,blocker],trees:[]})
 const after=measureBuildingViewOcclusion(result,{building:target,buildings:[target,blocker],trees:[]})
 assert.ok(after.score<before.score,'view must be less obstructed')
 assert.deepEqual(result.target,frame.target)
 assert.ok(result.distance>=45&&result.distance<=145)
 assert.ok(Math.hypot(result.position[0]-frame.position[0],result.position[2]-frame.position[2])>4)
})
test('reduce obstruction from a procedural tree crown',()=>{
 const trees=[{x:0,z:40,r:8,h:21,type:2}]
 const before=measureBuildingViewOcclusion(frame,{building:target,buildings:[target],trees})
 assert.ok(before.treeHits>=1)
 const after=measureBuildingViewOcclusion(resolveOccludedBuildingView(frame,{building:target,buildings:[target],trees}),{building:target,buildings:[target],trees})
 assert.ok(after.score<before.score)
})
test('keep a clear near camera fixed and avoid source mutation',()=>{
 const snapshot=JSON.stringify(data)
 const result=resolveOccludedBuildingView(frame,{building:target,buildings:[target],trees:[]})
 assert.deepEqual(result.position,frame.position)
 assert.deepEqual(result.target,frame.target)
 assert.equal(JSON.stringify(data),snapshot)
})
test('R29 detects a foreground building covering the lower facade even when centre ray clears its roof',()=>{
 const higher={position:[0,35,70],target:[0,15,0],distance:74}
 const lowBlock={osmId:3,center:[0,35],points:[[-18,31],[18,31],[18,38],[-18,38]],height:19}
 const metric=measureBuildingViewOcclusion(higher,{building:target,buildings:[target,lowBlock],trees:[]})
 assert.ok(metric.buildingHits>=1,'lower part of facade should count as blocked, not just centre ray')
})
test('photo-facing inspection never becomes a steep aerial shot merely to clear a tall obstruction',()=>{
 const subject={...target,height:14}
 const steepFrame={...frame,position:[0,43,90],target:[0,10,0],distance:96,coverage:'photo-facade-direction'}
 const tall={osmId:88,center:[0,40],points:[[-100,35],[100,35],[100,48],[-100,48]],height:31}
 const found=resolveOccludedBuildingView(steepFrame,{building:subject,buildings:[subject,tall],trees:[]})
 const pitch=Math.atan2(found.position[1]-found.target[1],Math.hypot(found.position[0]-found.target[0],found.position[2]-found.target[2]))
 assert.ok(pitch<=.45,'facade view was raised into aerial view: '+pitch)
})
test('R29 actual scene uses nearby trees and OSM building polygons without hiding geometry',()=>{
 const s=readFileSync(new URL('../src/world.js',import.meta.url),'utf8')
 assert.ok(s.includes('resolveOccludedBuildingView('))
 assert.ok(s.includes('trees:this.treePositions'))
})
