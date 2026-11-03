import {createReadStream} from 'node:fs';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PutObjectCommand,S3Client} from '@aws-sdk/client-s3';
import {bundle} from '@remotion/bundler';
import {renderMedia,selectComposition} from '@remotion/renderer';
import type {RendererConfig} from './config.js';
import {buildSilentTimeline} from './narration.js';
import type {NewsShortProps,RenderRequest,RenderStatus} from './types.js';

let serveUrlPromise:Promise<string>|undefined;
const running=new Set<string>();

export function isRunning(jobId:string){return running.has(jobId)}
export function startRender(request:RenderRequest,config:RendererConfig){if(running.has(request.jobId))return false;running.add(request.jobId);void processRender(request,config).finally(()=>running.delete(request.jobId));return true}

async function processRender(request:RenderRequest,config:RendererConfig){
  const workdir=await mkdtemp(join(tmpdir(),`5waveflow-${request.jobId}-`));
  try{
    await callback(request,config,'generating_script');
    const sections=request.script.sections||[];
    await callback(request,config,'generating_audio');
    const timeline=buildSilentTimeline(request.script.hook||'',sections,request.script.disclaimer||'',request.durationSeconds);
    await callback(request,config,'rendering');
    const props:NewsShortProps={hook:request.script.hook||'',sections:timeline.sections,branding:request.script.branding||'5WaveFlow',disclaimer:request.script.disclaimer||'',captions:timeline.captions};
    const serveUrl=await getServeUrl(),durationSeconds=request.durationSeconds,durationInFrames=Math.ceil(durationSeconds*request.fps);
    const composition=await selectComposition({serveUrl,id:request.composition,inputProps:props,browserExecutable:config.browserExecutable});
    const outputPath=join(workdir,`${request.jobId}.mp4`);
    let reportedProgress=80,progressCallbacks=Promise.resolve();
    await renderMedia({serveUrl,composition:{...composition,durationInFrames,width:request.width,height:request.height,fps:request.fps},codec:'h264',outputLocation:outputPath,inputProps:props,concurrency:config.renderConcurrency,browserExecutable:config.browserExecutable,onProgress:({progress})=>{const next=Math.min(98,80+Math.floor(progress*18));if(next<reportedProgress+2)return;reportedProgress=next;progressCallbacks=progressCallbacks.then(()=>callback(request,config,'rendering',{progressPercent:next})).catch(error=>console.error('progress callback failed',request.jobId,error))}});
    await progressCallbacks;
    const r2Key=`renders/${request.projectId}/${request.jobId}.mp4`,client=new S3Client({region:'auto',endpoint:config.r2Endpoint,credentials:{accessKeyId:config.r2AccessKeyId,secretAccessKey:config.r2SecretAccessKey}});
    await client.send(new PutObjectCommand({Bucket:config.r2Bucket,Key:r2Key,Body:createReadStream(outputPath),ContentType:'video/mp4'}));
    await callback(request,config,'completed',{r2Key,durationSeconds,estimatedCostUsd:0,progressPercent:100});
  }catch(error){console.error('render failed',request.jobId,error);await callback(request,config,'failed',{error:safeError(error)}).catch(callbackError=>console.error('failure callback failed',callbackError))}
  finally{await rm(workdir,{recursive:true,force:true})}
}

function getServeUrl(){serveUrlPromise??=bundle({entryPoint:fileURLToPath(new URL('./remotion/index.js',import.meta.url)),onProgress:progress=>console.info(`bundle ${Math.round(progress)}%`)});return serveUrlPromise}
async function callback(request:RenderRequest,config:RendererConfig,status:RenderStatus,extra:Record<string,unknown>={}){const supplied=new URL(request.callbackUrl),expected=new URL('/api/video/webhook',config.appOrigin);if(supplied.origin!==expected.origin||supplied.pathname!==expected.pathname)throw new Error('Untrusted callback URL');const response=await fetch(supplied,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${config.webhookToken}`},body:JSON.stringify({jobId:request.jobId,status,...extra}),signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error(`Callback ${status} failed (${response.status})`)}
function safeError(error:unknown){return (error instanceof Error?error.message:String(error)).replace(/[\r\n]+/g,' ').slice(0,500)}
