import * as THREE from 'three';

/**
 * Subtle, tileable canopy surface relief. Independently generated, no photos.
 * Real trees still require correctly species-tagged survey imagery to replace
 * this indicative vegetation representation.
 */
export function makeCanopyTexture(){
 const size=256;
 const canvas=document.createElement('canvas');
 canvas.width=canvas.height=size;
 const c=canvas.getContext('2d');
 c.fillStyle='#f0f4ec';c.fillRect(0,0,size,size);
 let state=0x4bc2e15;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)|0;return(state>>>0)/4294967296;};
 // Multiple semi-transparent clusters create natural variation without
 // alpha sorting, expensive 3D particles, or source-image dependencies.
 for(let i=0;i<2100;i++){
  const x=random()*size,y=random()*size;
  const a=1.8+random()*5.7,b=.6+random()*2.5;
  const shade=random();
  c.save();c.translate(x,y);c.rotate(random()*6.28318);
  c.beginPath();c.ellipse(0,0,a,b,0,0,6.28318);
  c.fillStyle=shade>.55?'rgba(255,255,255,.15)':'rgba(93,119,78,.12)';
  c.fill();c.restore();
 }
 const map=new THREE.CanvasTexture(canvas);
 map.colorSpace=THREE.SRGBColorSpace;
 map.wrapS=map.wrapT=THREE.RepeatWrapping;
 map.repeat.set(2.5,2);
 map.anisotropy=4;
 map.generateMipmaps=true;
 return map;
}
