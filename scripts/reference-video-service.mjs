import {createReadStream}from'node:fs';
import {stat}from'node:fs/promises';
import {join}from'node:path';
// Read-only access to the supplied source. Supports browser byte-range seeking.
export function referenceVideoService(root){return async(req,res,next)=>{
 if(new URL(req.url,'http://localhost').pathname!=='/api/reference-video')return next();
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
 const path=join(root,'research/original/training.mp4');let info;
 try{info=await stat(path)}catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('De bronvideo staat niet in deze installatie. De opgeslagen controlebeelden blijven beschikbaar.');return;}
 let start=0,end=info.size-1,status=200;
 if(req.headers.range){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!m){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),end):end;if(!Number.isSafeInteger(start)||start>end){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}status=206;}
 res.writeHead(status,{'Content-Type':'video/mp4','Content-Length':end-start+1,'Accept-Ranges':'bytes',...(status===206?{'Content-Range':`bytes ${start}-${end}/${info.size}`}:{})});
 if(req.method==='HEAD'){res.end();return;}const stream=createReadStream(path,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
};}
