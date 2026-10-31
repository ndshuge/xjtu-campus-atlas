// Closed test-course timing only; never implies legal driving access on campus.
export function createRaceSandbox({checkpoints,lapCount=1}){
 if(!Array.isArray(checkpoints)||checkpoints.length<2||new Set(checkpoints).size!==checkpoints.length||!Number.isInteger(lapCount)||lapCount<1)throw Error('invalid course');
 let index=0,laps=0,started=null,elapsed=null,lastTime=-Infinity;
 return Object.freeze({
  pass(checkpoint,nowMs){
   if(elapsed!==null||!Number.isFinite(nowMs)||nowMs<lastTime||checkpoint!==checkpoints[index])return false;
   if(started===null)started=nowMs;
   lastTime=nowMs;
   index++;
   if(index===checkpoints.length){index=0;laps++;if(laps===lapCount)elapsed=nowMs-started;}
   return true;
  },
  get completed(){return elapsed!==null},
  get elapsedMs(){return elapsed},
  reset(){index=0;laps=0;started=null;elapsed=null;lastTime=-Infinity}
 });
}
