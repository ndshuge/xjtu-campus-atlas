import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createLibraryAsset} from '../src/library-asset.js';
import {libraryAssetPlan} from '../src/library-asset-plan.js';

const campus=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const building=campus.buildings.find(b=>b.osmId===263624481);
const plan=libraryAssetPlan(building);

test('south podium has central recessed glazing framed by substantial stone-wing massing',()=>{
 const asset=createLibraryAsset({building,buildingIndex:0,baseY:1.1});
 try{
  assert.equal(asset.children.length,7,'Keep material batching unchanged');
  assert.equal(asset.userData.osmId,263624481);
  const meta=asset.userData.southPodiumMassing;
  assert.equal(meta?.photoInformed,true);
  assert.equal(meta?.estimated,true);
  assert.ok(meta.glassWidthRatio>=.50&&meta.glassWidthRatio<=.63,'Photo-supported central glazing must not cover entire podium');
  assert.ok(meta.stoneWingEachRatio>=.18,'Each pale wing must be a substantial share of the front');
  const glass=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ glass'));
  const wall=asset.children.find(m=>m.isMesh&&m.name.endsWith('/ wall'));
  assert.ok(glass&&wall);
  asset.updateMatrixWorld(true);
  const ray=new THREE.Raycaster();
  const hit=(mesh,x)=>{
   ray.set(new THREE.Vector3(x,1.1+.51,-55),new THREE.Vector3(0,0,-1));
   return ray.intersectObject(mesh,false).filter(h=>h.point.z>-76.4&&h.point.z<-74.8);
  };
  const center=plan.centerX+6;
  const wingRight=meta.glassBounds[1]+4;
  const wingLeft=meta.glassBounds[0]-4;
  assert.ok(hit(glass,center).length>0,'Central glass must remain a real facade');
  for(const x of [wingLeft,wingRight]){
   assert.equal(hit(glass,x).length,0,'Near-ground stone wings must not be glazed across the whole front');
   assert.ok(hit(wall,x).length>0,'Side mass must physically be stone at the first storey');
  }
 }finally{asset.dispose();}
});

test('neutral library massing omits photo-estimated podium detail',()=>{
 const asset=createLibraryAsset({building,stage:'massing'});
 try{assert.equal(asset.userData.southPodiumMassing,null);}finally{asset.dispose();}
});
