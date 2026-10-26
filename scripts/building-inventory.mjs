import fs from 'node:fs';
const bounds=pts=>[Math.min(...pts.map(p=>p[0])),Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[1]))];
const d=JSON.parse(fs.readFileSync(new URL('../public/data/campus.json', import.meta.url),'utf8'));
for(const b of d.buildings.filter(b=>[263624481,263624057,263632364,263625088].includes(b.osmId)||/主楼|图书|科学|教二|教学|中心|工科/.test(b.name||''))){ const bb=bounds(b.points); console.log(JSON.stringify({osmId:b.osmId,name:b.name,height:b.height,area:b.area,category:b.category,bounds:bb,footprintCount:b.points.length,holes:b.holes?.length||0})); }
