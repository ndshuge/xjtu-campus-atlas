import fs from 'node:fs'
const data=JSON.parse(fs.readFileSync('public/data/campus.json','utf8'))
const roads=data.roads.filter(r=>r.campus&&['unclassified','service','residential','living_street'].includes(r.kind)&&r.width>=3.5&&r.width<=12&&r.points.length>=2)
console.log('CAMPUS',data.roads.filter(r=>r.campus).length,'CANDIDATES',roads.length)
const key=p=>p.map(v=>Math.round(v*10)).join(',')
const byPoint=new Map()
for(const r of roads)for(const p of r.points){const k=key(p);const s=byPoint.get(k)||new Set();s.add(r.id);byPoint.set(k,s)}
const union=new Map(roads.map(x=>[x.id,x.id]))
function root(x){while(union.get(x)!==x)x=union.get(x);return x}
for(const ids of byPoint.values()){const a=[...ids];for(const x of a)union.set(root(x),root(a[0]))}
const parts=new Map()
for(const r of roads){const id=root(r.id),ls=parts.get(id)||[];ls.push(r);parts.set(id,ls)}
const sorted=[...parts.values()].sort((a,b)=>b.length-a.length)
console.log('GROUPS',sorted.length)
for(const [i,list] of sorted.slice(0,8).entries()){
 const meters=list.reduce((s,r)=>s+r.points.slice(1).reduce((n,p,j)=>n+Math.hypot(p[0]-r.points[j][0],p[1]-r.points[j][1]),0),0)
 console.log('GROUP',i,'ways',list.length,'meters',Math.round(meters),'roadNames',JSON.stringify(list.filter(x=>x.name).map(x=>x.name).slice(0,22)),'HAS_START',list.some(x=>x.id==='way/148313517/0'))
}
for(const r of roads.filter(r=>r.name||r.id==='way/148313517/0').slice(0,50))console.log('NAMED',r.id,r.name,r.kind,'width',r.width,'points',r.points.length)
