// Isolated benign targets; never raycast against real campus building meshes.
export function createTargetPractice({targetIds=[]}={}){
 const targets=new Set(targetIds),hitTargets=new Set();let score=0,paused=false;
 return Object.freeze({
  hit(id){if(paused||!targets.has(id)||hitTargets.has(id))return false;hitTargets.add(id);score++;return true},
  get score(){return score},
  get completed(){return targets.size>0&&hitTargets.size===targets.size},
  get remaining(){return targets.size-hitTargets.size},
  pause(){paused=true},
  resume(){paused=false},
  reset(){score=0;paused=false;hitTargets.clear()}
 });
}
