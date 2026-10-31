// Isolated benign targets; never raycast against real campus building meshes.
export function createTargetPractice({targetIds=[]}={}){
 const targets=new Set(targetIds);let score=0,paused=false;
 return Object.freeze({
  hit(id){if(paused||!targets.has(id))return false;score++;return true},
  get score(){return score},
  pause(){paused=true},
  resume(){paused=false},
  reset(){score=0;paused=false}
 });
}
