import test from 'node:test';
import assert from 'node:assert/strict';
import {treeGeometry} from '../src/campus-vegetation.js';

const inspect=(kind,detail)=>{const g=treeGeometry(kind,detail,1956);try{return {
  leaves:g.leaves.attributes.position.count/3,
  wood:g.wood.attributes.position.count/3,
  leafCards:g.leafCards,
  boundingRadius:(g.leaves.computeBoundingSphere(),g.leaves.boundingSphere.radius)
}}finally{g.wood.dispose();g.leaves.dispose()}};

test('far tree sprayers reduce per-instance triangles without removing the near tree shape',()=>{
 for(const kind of ['plane','cedar']){
  const near=inspect(kind,'near'),far=inspect(kind,'far');
  assert.equal(near.leafCards,kind==='cedar'?68:92,'near LOD remains untouched');
  assert.ok(far.leafCards<= (kind==='cedar'?24:34),'far geometry must measurably lower per-tree leaf triangles');
  assert.equal(far.leaves,far.leafCards*2,'sprays remain lightweight two-triangle cards');
  assert.ok(far.wood>0&&far.leaves>0);
  assert.ok(far.boundingRadius>4&&far.boundingRadius<13,'retain plausible outer crown bounds');
 }
});

test('distant size compensation remains explicit and photo-L0 independent',()=>{
 const geo=treeGeometry('plane','far',1956);
 try{assert.ok(geo.leafCards>=30);assert.ok(geo.leaves.boundingSphere||geo.leaves.computeBoundingSphere())}
 finally{geo.wood.dispose();geo.leaves.dispose()}
});
