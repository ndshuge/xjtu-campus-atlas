import * as THREE from 'three';

/* Deterministic campus albedo, not commercial map photographs. */
export function createSurfaceTexture(kind='pavers'){
  const canvas=document.createElement('canvas');
  const size=256;canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d');
  const frame=ctx.createImageData(size,size);
  frame.data.set(generateSurfacePixels(kind,size));
  ctx.putImageData(frame,0,0);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(kind==='pavers'?.12:.07,kind==='pavers'?.12:.07);
  const sampling=surfaceSampling(kind);
  texture.minFilter=THREE.LinearMipmapLinearFilter;
  texture.magFilter=THREE.LinearFilter;
  texture.generateMipmaps=sampling.generateMipmaps;
  texture.anisotropy=sampling.anisotropy;
  return texture;
}

// All photographs remain external reference evidence, never atlas inputs.
const clamp=v=>Math.max(0,Math.min(255,v));
const fract=v=>v-Math.floor(v);
function hash(x,y,seed){
 let q=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+seed)|0;
 q=Math.imul(q^(q>>>13),1274126177);
 return ((q^(q>>>16))>>>0)/4294967295;
}
function smooth(t){return t*t*(3-2*t);}
function coarseNoise(x,y,k,s){
 const a=x/k,b=y/k,xi=Math.floor(a),yi=Math.floor(b),u=smooth(fract(a)),v=smooth(fract(b));
 return (hash(xi,yi,s)*(1-u)+hash(xi+1,yi,s)*u)*(1-v)+(hash(xi,yi+1,s)*(1-u)+hash(xi+1,yi+1,s)*u)*v;
}
export function generateSurfacePixels(kind='pavers',size=256){
 if(!Number.isInteger(size)||size<64||size>1024)throw new RangeError('Invalid texture size');
 const pixels=new Uint8ClampedArray(size*size*4),pavers=kind==='pavers',water=kind==='water';
 const rowHeight=size/8,stoneWidth=size/4;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const grain=hash(x,y,kind==='asphalt'?319:101)-.5;
  const weather=coarseNoise(x,y,48,91)-.5;
  let r,g,b;
  if(pavers){
    const row=Math.floor(y/rowHeight),shift=(row%2)*stoneWidth*.5;
    const col=Math.floor((x+shift)/stoneWidth);
    const u=(x+shift)%stoneWidth,v=y%rowHeight;
    const seam=u<1.5||v<1.5;
    const stone=(hash(col,row,811)-.5)*13;
    const tone=234+stone+weather*7+grain*8-(seam?27:u<3||v<3?5:0);
    r=tone+3;g=tone+2;b=tone-1;
  }else if(water){
    const ripple=2.4*Math.sin(x*.14+y*.05)+1.6*Math.sin(y*.1-x*.06);
    const tone=240+grain*4+weather*3+ripple;r=tone-3;g=tone+1;b=tone;
  }else{
    // Three distinct aggregate scales avoid a flat uninterrupted road.
    const stone=coarseNoise(x,y,5,712)-.5;
    const tone=219+weather*15+stone*15+grain*11;
    r=tone+1;g=tone+1;b=tone-1;
  }
  const index=(y*size+x)*4;
  pixels[index]=clamp(r);pixels[index+1]=clamp(g);pixels[index+2]=clamp(b);pixels[index+3]=255;
 }
 return pixels;
}
export function surfaceSampling(kind='pavers',maxAnisotropy=8){
 const max=Number.isFinite(maxAnisotropy)?Math.max(1,Math.floor(maxAnisotropy)):1;
 return {colorSpace:'srgb',minFilter:'LinearMipmapLinearFilter',magFilter:'LinearFilter',
  generateMipmaps:true,anisotropy:Math.min(kind==='water'?4:8,max)};
}
