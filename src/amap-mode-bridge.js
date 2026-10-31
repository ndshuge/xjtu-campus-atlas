// Optional AMap navigation: map data never enters the Atlas renderer/colliders.
export async function toMapCoords({x,z},{origin,metresPerDegree},convert){
 if(![x,z,...(origin||[]),...(metresPerDegree||[])].every(Number.isFinite)||metresPerDegree.some(v=>v<=0))throw Error('invalid coordinates');
 if(typeof convert!=='function')throw Error('conversion unavailable');
 const coordinates=[origin[0]+x/metresPerDegree[0],origin[1]-z/metresPerDegree[1]];
 const gcj=await convert(coordinates);
 if(!Array.isArray(gcj)||gcj.length!==2||!gcj.every(Number.isFinite))throw Error('invalid converted coordinates');
 return gcj;
}
export function createMapModeBridge({capture,restore,open,close=()=>{},consent=()=>true}){
 let mode='atlas',snapshot=null;
 return Object.freeze({
  get mode(){return mode},
  async switchMapMode(next){
   if(next!=='atlas'&&next!=='amap')throw Error('unknown map mode');
   if(next===mode)return {mode};
   if(next==='atlas'){
    try{await close()}finally{restore(snapshot);snapshot=null;mode='atlas'}
    return {mode};
   }
   if(!consent())return {mode,reason:'consent-declined'};
   const before=capture();
   try{
    const response=await open();
    if(response!==true)throw Error('map unavailable');
    snapshot=before;mode='amap';return {mode};
   }catch(err){
    restore(before);snapshot=null;mode='atlas';return {mode,reason:'provider-unavailable'};
   }
  }
 });
}
