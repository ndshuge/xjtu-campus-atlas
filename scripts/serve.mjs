import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const port=Number(process.env.PORT||18866);
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain; charset=utf-8'};
const server=http.createServer((req,res)=>{let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}if(name.endsWith('/'))name+='index.html';const target=path.resolve(root,'.'+name);if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.stat(target,(error,stat)=>{if(error||!stat.isFile()){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache','Access-Control-Allow-Origin':'*'});fs.createReadStream(target).pipe(res);});});
server.listen(port,'127.0.0.1',()=>console.log('Campus: http://127.0.0.1:'+port+'/'));server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'端口已占用，可打开既有页面或设置 PORT 后重试。':e);process.exitCode=1;});
