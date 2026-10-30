import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {libraryAssetPlan} from '../src/library-asset-plan.js';
import {librarySouthInspectionPose} from '../src/library-inspection-pose.js';

const campus=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const plan=libraryAssetPlan(campus.buildings.find(b=>b.osmId===263624481));

test('reproducible south detail pose faces the library front, with phone breathing room',()=>{
 const desktop=librarySouthInspectionPose(plan,1.1,false);
 const mobile=librarySouthInspectionPose(plan,1.1,true);
 for(const pose of [desktop,mobile]){
  assert.equal(pose.eye[0],plan.centerX);
  assert.equal(pose.look[0],plan.centerX);
  assert.ok(pose.eye[2]>plan.courses[0].rect[3]+40,'camera must be south of facade');
  assert.ok(pose.look[2]<plan.courses[0].rect[3],'camera must look into the central tower');
  assert.ok(pose.look[1]>15&&pose.look[1]<35,'frame the tower, not the ground');
 }
 assert.ok(mobile.eye[2]>desktop.eye[2]+30,'mobile must step back to preserve vertical composition');
 assert.ok(mobile.fov>desktop.fov);
});
