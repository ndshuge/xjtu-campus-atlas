import * as THREE from 'three';

// Self-generated subtle ground variation. It deliberately does not pretend to
// reproduce aerial imagery and introduces no new asset rights or network calls.
export function makeGroundPattern(){
  const size=128;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d');
  const img=ctx.createImageData(size,size);
  let state=0x2c71c9ad;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)|0;return(state>>>0)/4294967296;};
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const a=x/size*Math.PI*2,b=y/size*Math.PI*2;
      const wave=7*Math.sin(2*a+.2)*Math.cos(3*b-.2)+4*Math.cos(5*a+2*b);
      const grain=(random()-.5)*18;
      const v=Math.max(192,Math.min(246,231+wave+grain));
      const i=(y*size+x)*4;
      img.data[i]=v;img.data[i+1]=v;img.data[i+2]=v-1;img.data[i+3]=255;
    }
  }
  ctx.putImageData(img,0,0);
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.repeat.set(.055,.055);
  map.anisotropy=8;
  map.generateMipmaps=true;
  return map;
}
