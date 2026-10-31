// Shared guards for Edge CDP walking QA. The camera is still flying from
// orbit to its spawn after mode changes to "walk"; mode alone is not ready.
export function walkReady(d, tolerance=0.35) {
  if (d?.mode !== 'walk' || d.walkTransition) return false;
  if (!Array.isArray(d.camera) || d.camera.length<3 ||
      !Array.isArray(d.walkStart) || d.walkStart.length<2) return false;
  const [x,z]=d.walkStart;
  return [x,z,d.camera[0],d.camera[2]].every(Number.isFinite) &&
    Math.hypot(d.camera[0]-x,d.camera[2]-z)<=tolerance;
}

export async function waitForWalkReady(sample, sleep, {
  timeoutMs=7000, intervalMs=100, now=Date.now
}={}) {
  const began=now();
  let last;
  while(true) {
    last=await sample();
    if(walkReady(last)) return last;
    if(now()-began>=timeoutMs)
      throw Error('Walk camera did not settle at spawn: '+
        JSON.stringify({mode:last?.mode,transition:last?.walkTransition,
          camera:last?.camera,walkStart:last?.walkStart}));
    await sleep(intervalMs);
  }
}

export function measureWalkDisplacement(before,after) {
  if(!walkReady(before))throw Error('Walk baseline was not settled at spawn');
  if(after?.mode!=='walk'||after.walkTransition)
    throw Error('Walk camera is still transitioning during displacement measurement');
  if(!Array.isArray(after.camera)||after.camera.length<3||!after.camera.every(Number.isFinite))
    throw Error('Walk camera position is invalid');
  return {
    metres:Math.hypot(...after.camera.map((v,i)=>v-before.camera[i])),
    fromSpawn:Math.hypot(after.camera[0]-before.walkStart[0],after.camera[2]-before.walkStart[1])
  };
}

export function measurePostCancelDrift(before,after,{maxMetres=.35}={}) {
  if(before?.mode!=='walk'||after?.mode!=='walk'||before.walkTransition||after.walkTransition)
    throw Error('Cannot test pointercancel during a camera transition');
  if(![before.camera,after.camera].every(v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite)))
    throw Error('Pointercancel camera diagnostics are invalid');
  const metres=Math.hypot(...after.camera.map((v,i)=>v-before.camera[i]));
  if(metres>maxMetres)throw Error('Movement persisted after pointercancel: '+metres.toFixed(3)+'m');
  return metres;
}
