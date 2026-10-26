// Mobile pixel budget and camera clearance. No geometry or OrbitControls replacement.
export const MOBILE_RENDER_CAPS = Object.freeze({low:1.5,high:1.8});
export function renderPixelRatio({width,height,deviceRatio,quality='high'}){
  const mobile=width<=768;
  const ratio=Math.max(1,Number(deviceRatio)||1);
  const cap=mobile?(MOBILE_RENDER_CAPS[quality]??MOBILE_RENDER_CAPS.low):1.8;
  // Bound internal pixels for large phones/tablets without inflating detail to hide z-fighting.
  const budget=mobile?2350000:Infinity;
  return Math.max(1,Math.min(ratio,cap,Math.sqrt(budget/Math.max(1,width*height))));
}
// MSAA alpha-to-coverage smooths distant alpha-tested foliage without changing tree layout.
// Fall back to original alpha test when the context has no multisampling.
export function enableFarFoliageCoverage(vegetation,gl){
  if(!vegetation?.group||!gl||gl.getParameter(gl.SAMPLES)<2)return 0;
  let updated=0;
  vegetation.group.traverse(object=>{
    const m=object.material;
    if(object.isInstancedMesh&&m?.map&&m.alphaTest>0&&!m.alphaToCoverage){
      m.alphaToCoverage=true;m.needsUpdate=true;updated++;
    }
  });
  return updated;
}
export function keepOrbitAboveGround(camera,groundY,clearance=3.2){
  const minimum=groundY+clearance;
  if(!Number.isFinite(camera.position.y))return false;
  if(camera.position.y>=minimum)return false;
  camera.position.y=minimum;
  return true;
}
export function framePercentiles(frameTimes){
  if(!frameTimes.length)return {p50Ms:null,p95Ms:null};
  const ms=frameTimes.filter(n=>Number.isFinite(n)&&n>0).map(n=>n*1000).sort((a,b)=>a-b);
  if(!ms.length)return {p50Ms:null,p95Ms:null};
  const value=q=>Math.round(ms[Math.ceil(q*ms.length)-1]*100)/100;
  return {p50Ms:value(.50),p95Ms:value(.95)};
}
