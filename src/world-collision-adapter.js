// Geometry-free authoritative collision proxies. Decals and facade meshes are NOT physics.
export function buildColliderProxies(snapshot,{minX=-Infinity,minZ=-Infinity,maxX=Infinity,maxZ=Infinity}={}){
 const zones=snapshot?.levelSurfaces||[];
 return Object.freeze(zones
  .filter(s=>Number.isFinite(s.y)&&s.walkable===true&&s.bounds
   &&s.bounds.maxX>=minX&&s.bounds.minX<=maxX&&s.bounds.maxZ>=minZ&&s.bounds.minZ<=maxZ)
  .map(s=>Object.freeze({
   shape:'horizontal-surface',levelId:s.levelId,y:s.y,
   bounds:Object.freeze({...s.bounds}),sourceVersion:snapshot.version||'unknown',
   confidence:s.confidence
  })));
}
