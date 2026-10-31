import test from 'node:test';
import assert from 'node:assert/strict';
import {treeGeometry} from '../src/campus-vegetation.js';

for(const [kind,farBudget,nearExpected] of [['plane',60,408],['cedar',96,192]]){
 test(`distant ${kind} branches use minimal triangles without altering the near LOD`,()=>{
  const far=treeGeometry(kind,'far',1956),near=treeGeometry(kind,'near',1956);
  try{
   assert.equal(near.wood.attributes.position.count/3,nearExpected,'near branches preserved');
   assert.ok(far.wood.attributes.position.count/3<=farBudget,'distant wood has verifiable per-tree triangle budget');
   far.wood.computeBoundingBox();near.wood.computeBoundingBox();
   assert.ok(far.wood.boundingBox.min.y<=.05);
   assert.ok(far.wood.boundingBox.max.y>=7.4,'trunk and canopy-support silhouette retained');
   assert.equal(far.leafCards,kind==='cedar'?24:34,'previous green far leaf budget preserved');
  }finally{
   for(const g of [far.wood,far.leaves,near.wood,near.leaves])g.dispose();
  }
 });
}
