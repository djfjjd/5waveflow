import {timingSafeEqual} from 'node:crypto';
import express from 'express';
import {loadConfig} from './config.js';
import {parseRenderRequest} from './validate.js';
import {isRunning,startRender} from './worker.js';

const config=loadConfig(),app=express();
app.disable('x-powered-by');
app.use(express.json({limit:'1mb'}));
app.get('/health',(_request,response)=>response.json({ok:true,service:'5waveflow-video-renderer'}));
app.post('/render',(request,response)=>{
  if(!authorized(request.headers.authorization,header(request.headers['x-make-apikey']),config.dispatchToken))return response.status(401).json({error:'Unauthorized'});
  try{const job=parseRenderRequest(request.body);if(isRunning(job.jobId))return response.status(202).json({ok:true,duplicate:true,jobId:job.jobId});startRender(job,config);return response.status(202).json({ok:true,accepted:true,jobId:job.jobId})}catch(error){return response.status(400).json({error:error instanceof Error?error.message:'Invalid render request'})}
});
app.use((_request,response)=>response.status(404).json({error:'Not found'}));
app.listen(config.port,()=>console.info(`5WaveFlow renderer listening on ${config.port}`));

function header(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value}
function authorized(authorization:string|undefined,apiKey:string|undefined,expected:string){const candidate=authorization?.startsWith('Bearer ')?authorization.slice(7).trim():apiKey?.trim();if(!candidate)return false;const left=Buffer.from(candidate),right=Buffer.from(expected);return left.length===right.length&&timingSafeEqual(left,right)}
