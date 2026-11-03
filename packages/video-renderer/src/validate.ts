import type {RenderRequest} from './types.js';

export function parseRenderRequest(value:unknown):RenderRequest{
  if(!value||typeof value!=='object')throw new Error('JSON body is required');
  const input=value as Record<string,unknown>,script=input.script as Record<string,unknown>|undefined,output=input.output as Record<string,unknown>|undefined;
  if(input.version!==1||typeof input.jobId!=='string'||!isUuid(input.jobId)||typeof input.projectId!=='string'||!isUuid(input.projectId))throw new Error('Invalid render job identity');
  if(input.composition!=='NewsShort'||input.width!==1080||input.height!==1920||input.fps!==30||![30,60,90].includes(Number(input.durationSeconds)))throw new Error('Unsupported render configuration');
  if(!script||!Array.isArray(script.sections)||script.sections.length<1||script.sections.length>20||output?.format!=='mp4')throw new Error('Invalid script or output');
  if(!['none','male','female'].includes(String(input.voice))||Number(input.voiceSpeed)<0.8||Number(input.voiceSpeed)>1.3)throw new Error('Invalid voice configuration');
  if(typeof input.callbackUrl!=='string')throw new Error('callbackUrl is required');
  return input as unknown as RenderRequest;
}

function isUuid(value:string){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)}
