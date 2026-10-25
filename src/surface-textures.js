import * as THREE from 'three';

/* Procedural, deterministic campus paving rather than unlicensed source photography. */
export function createSurfaceTexture(kind='pavers'){
  const canvas=document.createElement('canvas');
  const size=256;canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d');
  let seed=kind==='pavers'?1860:1932;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
  const frame=ctx.createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const water=kind==='water';
    const noise=(random()-.5)*(water?5:kind==='pavers'?12:17);
    const seam=kind==='pavers' && ((y%32===0)||(x%64===((Math.floor(y/32)%2)*32))) ? -25:0;
    const ripple=water?3*Math.sin(x*.12+y*.045)+2*Math.sin(y*.20-x*.075):0;
    const grain=Math.round((kind==='pavers'?240:water?244:231)+noise+seam+ripple);
    const idx=(y*size+x)*4;
    frame.data[idx]=Math.max(0,Math.min(255,grain));
    frame.data[idx+1]=Math.max(0,Math.min(255,grain-1));
    frame.data[idx+2]=Math.max(0,Math.min(255,grain-2));
    frame.data[idx+3]=255;
  }
  ctx.putImageData(frame,0,0);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(kind==='pavers'?.12:.07,kind==='pavers'?.12:.07);
  texture.anisotropy=8;
  return texture;
}
