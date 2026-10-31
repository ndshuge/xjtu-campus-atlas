// R17 optional game lifecycle. The map remains the only default runtime mode.
export function createGameModeHost({capture,restore}){
 const modes=new Map();let current=null,snapshot=null,cleanups=[];
 function cleanup(){
  for(const fn of cleanups.splice(0).reverse()){try{fn()}catch{}}
 }
 return Object.freeze({
  get mode(){return current?.id||'explore'},
  registerMode(mode){
   if(!mode?.id||mode.id==='explore'||modes.has(mode.id))throw Error('duplicate or invalid mode');
   modes.set(mode.id,mode);return this;
  },
  async enterMode(id,options={}){
   if(current)await this.exitMode();
   const mod=modes.get(id);if(!mod)return {mode:'explore',reason:'unavailable'};
   snapshot=capture();
   try{
    await mod.onEnter?.({options,onCleanup:fn=>cleanups.push(fn)});
    current=mod;
    return {mode:mod.id};
   }catch(err){
    cleanup();try{await mod.dispose?.()}catch{}
    restore(snapshot);snapshot=null;current=null;
    return {mode:'explore',reason:'enter-failed'};
   }
  },
  tick(delta){
   if(current&&Number.isFinite(delta)&&delta>0)current.onTick?.(delta);
  },
  async exitMode(){
   if(!current)return {mode:'explore'};
   const leaving=current;current=null;
   try{await leaving.onExit?.()}finally{
    cleanup();try{await leaving.dispose?.()}finally{restore(snapshot);snapshot=null;}
   }
   return {mode:'explore'};
  }
 });
}
