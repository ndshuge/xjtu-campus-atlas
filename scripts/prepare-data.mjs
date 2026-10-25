import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const raw=JSON.parse(await fs.readFile(process.argv[2]||path.resolve(root,'data/source-osm.json'),'utf8'));
const es=raw.elements, relation=es.find(e=>e.type==='relation'&&e.id===17568632);
const origin=[108.9793,34.2473],latRadians=origin[1]*Math.PI/180,den=Math.sqrt(1-0.00669437999014*Math.sin(latRadians)**2),mx=6378137/den*Math.cos(latRadians)*Math.PI/180,mz=6378137*(1-0.00669437999014)/den**3*Math.PI/180;
const project=p=>[+((p.lon-origin[0])*mx).toFixed(3),+((origin[1]-p.lat)*mz).toFixed(3)];
function join(members,role='outer'){
 const pending=members.filter(m=>m.role===role&&m.geometry?.length).map(m=>m.geometry.slice());const rings=[];
 const eq=(a,b)=>Math.abs(a.lat-b.lat)<1e-8&&Math.abs(a.lon-b.lon)<1e-8;
 while(pending.length){let a=pending.shift(),merged=true;while(!eq(a[0],a.at(-1))&&merged){merged=false;for(let i=0;i<pending.length;i++){let b=pending[i];if(eq(a.at(-1),b[0]))a.push(...b.slice(1));else if(eq(a.at(-1),b.at(-1)))a.push(...b.slice(0,-1).reverse());else if(eq(a[0],b.at(-1)))a.unshift(...b.slice(0,-1));else if(eq(a[0],b[0]))a.unshift(...b.slice(1).reverse());else continue;pending.splice(i,1);merged=true;break;}}if(eq(a[0],a.at(-1)))rings.push(a.map(project));else throw Error('Unclosed multipolygon ring');}return rings;
}
const boundary=join(relation.members);
export function inside(p,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
const onCampus=p=>boundary.some(r=>inside(p,r));
const centroid=ps=>{let a=ps.slice(0,-1);return a.reduce((s,p)=>[s[0]+p[0]/a.length,s[1]+p[1]/a.length],[0,0]);};
const area=ps=>Math.abs(ps.reduce((s,p,i)=>{const n=ps[(i+1)%ps.length];return s+p[0]*n[1]-n[0]*p[1]},0)/2);
const poly=e=>e.type==='relation'?join(e.members)[0]:e.geometry?.map(project);
const buildingMembers=new Set(es.filter(e=>e.type==='relation'&&e.tags?.building).flatMap(e=>e.members.map(m=>m.ref)));
const landmarks=new Set([263624481,263624057,263625088,1167525875,263632364,263624056]);
const cats={academic:'教学科研',living:'书院生活',culture:'校园地标',sports:'运动场馆',service:'生活服务'};
const heightOverrides={263624481:49.75,263624057:80.5,263624058:27,263624059:27,263624060:27,263624061:27,263625088:14,263625087:14,263625089:14,263632364:21,263624056:16,263625679:16,264106085:18,264108763:17};
const buildings=[],roads=[],surfaces=[],pois=[];
for(const e of es){const t=e.tags||{};
 if(t.building&&t.building!=='no'&&(e.geometry||e.members)&&!buildingMembers.has(e.id)){
  const points=poly(e);if(!points||points.length<4)continue;const center=centroid(points);if(!onCampus(center))continue;
  const name=t.name||'未命名建筑';let category=/舍|书院|公寓|宿舍|住宅/.test(name)||/apartments|dormitory|residential/.test(t.building)?'living':/餐|苑|浴|医院|邮局|出版|酒店|宾馆|商/.test(name)?'service':/体育|文体|球馆|健身/.test(name)?'sports':landmarks.has(e.id)||/纪念|博物|图书/.test(name)?'culture':'academic';
  let levels=Number.parseFloat(t['building:levels']);let explicit=Number.parseFloat(t.height);let estimated=!Number.isFinite(explicit);let height=explicit||((levels||({living:6,academic:4,service:4,culture:5,sports:3}[category]))*3.5);
  if(heightOverrides[e.id]&& !explicit)height=heightOverrides[e.id];
  const holes=e.type==='relation'?join(e.members,'inner'):[];
  const b={id:`${e.type}/${e.id}`,osmId:e.id,name,category,categoryName:cats[category],points,holes,center:center.map(v=>+v.toFixed(2)),area:+area(points).toFixed(1),height,levels:levels||null,heightSource:explicit?'osm-height':levels?'osm-levels-estimated-height':'procedural-estimate',landmark:landmarks.has(e.id),tags:t};
  if(e.id===263624481){b.heightSource='official-document-height';b.heightEvidence={height:49.75,scope:'钱学森图书馆南楼地面高度',source:'https://news.xjtu.edu.cn/info/1002/66472.htm',published:'2016-11-21',note:'学校历史报道给出的高度；分段体量为解释性建模，并非竣工图。'};}
  if(e.id===263624057)b.heightEvidence={source:'https://news.xjtu.edu.cn/info/1219/143933.htm',note:'学校报道提及主楼23层宣怀厅，模型主体按23×3.5m估高，另加4m示意屋顶。未获得实测总高度。'};
  if(e.id===263632771||e.id===264421116)b.notice='建设变动提示：学校新版平面图在该片区标注教三楼（在建）；当前为 OSM 存量轮廓，未获得最新竣工图。';
  if(e.id===264288694)b.notice='OSM 仍标为“西迁纪念馆”，与学校新版平面图存在名称时效差异；请以现场为准。西迁博物馆位于校园南部。';
  buildings.push(b);
 }
 if(e.type==='way'&&t.highway&&e.geometry?.length>1&&!/proposed|construction|platform/.test(t.highway)){
  const ps=e.geometry.map(project);const pieces=[];let current=[];
  // Clip rendering to a small campus context box; preserve survey vertices.
  for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];if(mid[0]>-495&&mid[0]<800&&mid[1]>-625&&mid[1]<600){if(!current.length)current.push(a);current.push(b);}else if(current.length){pieces.push(current);current=[];}}if(current.length)pieces.push(current);
  for(let j=0;j<pieces.length;j++){const points=pieces[j],center=points[Math.floor(points.length/2)];let width=Number.parseFloat(t.width)||({footway:2.2,path:2.2,steps:2.4,service:4.5,pedestrian:6,unclassified:7,residential:7,tertiary:13,secondary:20,primary:24,cycleway:2.5}[t.highway]||5);roads.push({id:`way/${e.id}/${j}`,osmId:e.id,name:t.name||'',kind:t.highway,points,width,campus:onCampus(center),bridge:t.bridge==='yes'});}
 }
 if((e.geometry||e.members)&&!t.building&&(t.natural||t.landuse||t.leisure||t.area==='yes'&&t.highway==='pedestrian')){
  if(e.type==='relation'&&!e.members?.some(m=>m.geometry))continue;let points;try{points=poly(e);}catch{continue;}if(!points||points.length<4)continue;const center=centroid(points);if(!onCampus(center))continue;let kind=t.natural==='water'?'water':t.leisure==='pitch'?'pitch':/wood|tree_row|scrub/.test(t.natural||'')?'wood':/grass|meadow|forest/.test(t.landuse||'')||t.leisure==='park'||t.leisure==='garden'?'green':t.highway==='pedestrian'?'plaza':null;
  if(kind)surfaces.push({id:`${e.type}/${e.id}`,name:t.name||'',points,center,kind,sport:t.sport||null,area:area(points),tags:t});
 }
 if(e.type==='node'&&t.name&&Number.isFinite(e.lat)){const position=project(e);if(onCampus(position)||t.name==='西安交通大学北门')pois.push({id:`node/${e.id}`,name:t.name,position,tags:t,lon:e.lon,lat:e.lat});}
}
const landmarksExtra=[
 {match:'腾飞塔',name:'腾飞塔',category:'culture',description:'校园中轴上的标志性纪念塔。位置来自 OSM 节点；塔身、台阶与雕塑为示意建模。'},
 {match:'西安交通大学北门',name:'北门',category:'culture',description:'面向咸宁西路与兴庆宫的校园入口。位置来自 OSM；门柱与校名牌为程序化示意。'},
];
for(const l of landmarksExtra){const p=pois.find(p=>p.name===l.match);if(p)l.position=p.position,l.id=p.id,l.lat=p.lat,l.lon=p.lon;}
const southGate=roads.find(r=>/友谊/.test(r.name));
// Four Inventions Square: a named public place on the university plan. Its center is interpretive.
const interpretive=[{id:'interpretive/four-inventions',name:'四大发明广场',position:project({lon:108.97896,lat:34.24712}),category:'culture',description:'官方平面图确认的中轴广场。定位为依校园中轴推定的示意中心，不是测绘点位。',source:'official-map-interpretive'}];
const data={schema:1,title:'西安交通大学 · 兴庆校区',origin,projection:{type:'local-equirectangular',units:'metres',x:'east',z:'south',metresPerDegree:[mx,mz]},boundary,buildings,roads,surfaces,pois,landmarks:landmarksExtra.filter(l=>l.position),interpretive,metadata:{retrieved:'2026-10-25',osmTimestamp:raw.osm3s.timestamp_osm_base,osmRelation:17568632,license:'ODbL-1.0',attribution:'© OpenStreetMap contributors',source:'https://www.openstreetmap.org/relation/17568632',officialMap:'https://vi.xjtu.edu.cn/qt/jddt.htm',notes:['仅兴庆校区；不含雁塔、曲江与创新港。','全部建筑基底源自 OSM，可能缺失未被贡献者绘制的新建筑。','无高度标签时按 OSM 层数或建筑类别估算；立面、屋顶、单株树木、纪念塔外观为示意。','地形采用平面近似，非 BIM、倾斜摄影或测绘成果。','OSM 与官方新图存在建设和名称时效差异，逐建筑展示已知提示。']}};
data.projection.scaleModel='WGS84 ellipsoid prime-vertical and meridional radii at origin latitude';
data.metadata.notes[2]='图书馆南楼最高体量参考学校2016年文献49.75m；其余高度按OSM层数、类别或地标估算。立面、屋顶、单株树木与纪念塔外观为示意。';
await fs.mkdir(path.join(root,'public/data'),{recursive:true});await fs.writeFile(path.join(root,'public/data/campus.json'),JSON.stringify(data));
const selectedIds=new Set([...buildings.map(b=>b.osmId),...roads.map(r=>r.osmId),...surfaces.map(s=>Number(s.id.split('/')[1])),...pois.map(p=>Number(p.id.split('/')[1])),17568632]);
await fs.writeFile(path.join(root,'public/data/osm-source.json'),JSON.stringify({...raw,elements:es.filter(e=>selectedIds.has(e.id))}));
console.log(JSON.stringify({buildings:buildings.length,named:buildings.filter(b=>b.name!=='未命名建筑').length,roads:roads.length,surfaces:surfaces.length,pois:pois.length,levels:buildings.filter(b=>b.levels).length,explicitHeight:buildings.filter(b=>b.heightSource==='osm-height').length,boundaryRings:boundary.length,bytes:(await fs.stat(path.join(root,'public/data/campus.json'))).size},null,2));
