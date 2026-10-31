import * as THREE from 'three';

// Photo-guided broad dark stone bands (Liuxingy, 2021, CC BY-SA 4.0).
// Placement is a conservative visual estimate inside the existing mapped
// Four Inventions open corridor, NOT a measured paving survey or terrain edit.
export const PHOTO_PAVING_INLAYS=Object.freeze([
 Object.freeze({x0:-60,x1:-4,z0:-36,z1:-5,width:.56}),
 Object.freeze({x0:-44,x1:-20,z0:-28,z1:-11,width:.52})
]);

export function createPhotoPavingGeometry(y){
 if(!Number.isFinite(y))throw Error('invalid paving surface elevation');
 const p=[],n=[],uv=[];
 const rect=(x0,x1,z0,z1)=>{
  if(x1<=x0||z1<=z0)throw Error('invalid paving strip bounds');
  const q=[[x0,z0],[x0,z1],[x1,z1],[x1,z0]];
  for(const k of [0,1,2,0,2,3]){
   const [x,z]=q[k];p.push(x,y,z);n.push(0,1,0);uv.push(x/2,z/2);
  }
 };
 for(const {x0,x1,z0,z1,width:w} of PHOTO_PAVING_INLAYS){
  if(x1-x0<=2*w||z1-z0<=2*w)throw Error('inlay is too small');
  rect(x0,x1,z0,z0+w);
  rect(x0,x1,z1-w,z1);
  rect(x0,x0+w,z0+w,z1-w);
  rect(x1-w,x1,z0+w,z1-w);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 g.computeBoundingBox();g.computeBoundingSphere();
 return g;
}
