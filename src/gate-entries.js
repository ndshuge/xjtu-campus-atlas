const names=['西北门','东北门','东南门','西南门'];
/** OSM gate-derived entries, with the two South Gate posts combined into one location. */
export function getCampusGateEntries(data){
 const result=[];
 for(const name of names){
  const p=data.pois.find(q=>q.name===name&&q.tags?.barrier==='gate');
  if(!p)continue;
  result.push({
   ...p,category:'culture',categoryName:'校园入口',
   description:name+'位置来自 OSM 的 gate 节点，门廊造型为示意，不代表实测尺寸或实际通行状态。',
   source:'OpenStreetMap gate node',
   gateType:'osm-point'
  });
 }
 const south=data.pois.filter(p=>p.name==='南门'&&p.tags?.barrier==='gate');
 if(south.length>=2){
  const position=[
   south.reduce((s,p)=>s+p.position[0],0)/south.length,
   south.reduce((s,p)=>s+p.position[1],0)/south.length
  ];
  result.push({
   id:'osm-derived/south-gate',name:'南门',position,
   category:'culture',categoryName:'校园入口',
   description:'位置取 OSM 南门两个 gate 节点的中点；当前只提供示意入口造型，尚未完成真实立面测量。',
   gateType:'osm-two-posts',
   // Preserve both mapped openings so the sign fits in the central median.
   passagePositions:south.map(p=>[...p.position]),
   source:'OpenStreetMap gates',
   osmSources:south.map(p=>p.id)
  });
 }
 return result;
}
export function visualGatePosition(gate){
 const [x,z]=gate.position;
 // The OSM entrance point is preserved for labels; schematic structure
 // is offset a few metres towards the bordering road to avoid buildings.
 switch(gate.name){
  case '西北门': return [x-10,z];
  case '西南门': return [x-9,z];
  case '东北门': return [x+9,z];
  case '东南门': return [x+9,z];
  case '南门': return [x,z+5];
  default: return [x,z];
 }
}
