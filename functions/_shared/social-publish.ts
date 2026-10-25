export const supportedPlatforms=['instagram','youtube','tiktok','x','threads'] as const;
export type Platform=typeof supportedPlatforms[number];
export interface SocialPublishEnv { SNS_PUBLISH_WEBHOOK_URL?:string; SNS_PUBLISH_WEBHOOK_TOKEN?:string }
export interface PublishPayload { jobId:string; platforms:Platform[]; mediaUrl:string; title:string; caption:string; requestedAt:string; adminTokenExpiresAt?:number }

export async function parsePublishRequest(request:Request,jobId:string=crypto.randomUUID()):Promise<PublishPayload|Response>{
  const input=await request.json().catch(()=>null) as {jobId?:unknown;platforms?:unknown;mediaUrl?:unknown;title?:unknown;caption?:unknown;requestedAt?:unknown;adminTokenExpiresAt?:unknown}|null;
  if(!input||!Array.isArray(input.platforms)||typeof input.mediaUrl!=='string'||typeof input.title!=='string'||typeof input.caption!=='string')return json({error:'필수 게시 정보를 확인해 주세요.'},400);
  const platforms=[...new Set(input.platforms)].filter((value):value is Platform=>typeof value==='string'&&supportedPlatforms.includes(value as Platform));
  let mediaUrl:URL;
  try{mediaUrl=new URL(input.mediaUrl)}catch{return json({error:'올바른 미디어 URL을 입력해 주세요.'},400)}
  if(mediaUrl.protocol!=='https:'||!platforms.length||input.title.trim().length<1||input.title.length>100||input.caption.trim().length<1||input.caption.length>2200)return json({error:'게시 정보 또는 선택한 플랫폼을 확인해 주세요.'},400);
  return {jobId:typeof input.jobId==='string'&&input.jobId.length<=100?input.jobId:jobId,platforms,mediaUrl:mediaUrl.toString(),title:input.title.trim(),caption:input.caption.trim(),requestedAt:typeof input.requestedAt==='string'?input.requestedAt:new Date().toISOString(),adminTokenExpiresAt:typeof input.adminTokenExpiresAt==='number'?input.adminTokenExpiresAt:undefined};
}

export async function forwardPublish(payload:PublishPayload,request:Request,env:SocialPublishEnv){
  if(!env.SNS_PUBLISH_WEBHOOK_URL||!env.SNS_PUBLISH_WEBHOOK_TOKEN||env.SNS_PUBLISH_WEBHOOK_TOKEN.length<32)return json({error:'SNS 발행 Webhook이 설정되지 않았거나 토큰이 너무 짧습니다. 관리자에게 문의하세요.'},503);
  const target=safeTarget(env.SNS_PUBLISH_WEBHOOK_URL,request.url);
  if(!target)return json({error:'SNS 발행 Webhook URL이 현재 Pages 발행 API를 가리키거나 올바르지 않습니다.'},503);
  const upstream=await fetch(target,{method:'POST',headers:{'content-type':'application/json',...webhookAuthHeaders(target,env.SNS_PUBLISH_WEBHOOK_TOKEN),'x-idempotency-key':payload.jobId,'user-agent':'5waveflow-pages-publisher/1.0'},body:JSON.stringify(payload),signal:AbortSignal.timeout(25_000)}).catch(()=>null);
  if(!upstream)return json({error:'SNS 발행 서비스에 연결할 수 없습니다.'},502);
  if(!upstream.ok)return json({error:'SNS 발행 서비스가 요청을 거절했습니다.'},502);
  return json({ok:true,jobId:payload.jobId,platforms:payload.platforms,message:'선택한 SNS 채널로 업로드 요청을 전송했습니다.'},202);
}

export function webhookAuthHeaders(target:string,token:string):Record<string,string>{
  const hostname=new URL(target).hostname.toLowerCase();
  const isMake=hostname==='hook.make.com'||/^hook\.[a-z0-9-]+\.make\.com$/.test(hostname);
  return isMake?{'x-make-apikey':token}:{authorization:`Bearer ${token}`};
}

export function safeTarget(value:string,requestUrl:string){
  try{
    const target=new URL(value),current=new URL(requestUrl);
    const reserved=/^\/api\/(?:admin\/publish|sns\/webhook)\/?$/;
    if(target.protocol!=='https:'||target.origin===current.origin||reserved.test(target.pathname))return null;
    return target.toString();
  }catch{return null}
}

export async function hasValidBearer(request:Request,secret?:string){
  if(!secret||secret.length<32)return false;
  const header=request.headers.get('authorization');
  if(!header?.startsWith('Bearer '))return false;
  const supplied=header.slice(7);
  const [actual,expected]=await Promise.all([digest(supplied),digest(secret)]);
  let mismatch=actual.length^expected.length;
  for(let index=0;index<Math.max(actual.length,expected.length);index++)mismatch|=(actual[index]||0)^(expected[index]||0);
  return mismatch===0;
}

export async function hasValidSecret(supplied:string|undefined|null,secret?:string){
  if(!secret||secret.length<32||!supplied)return false;
  const [actual,expected]=await Promise.all([digest(supplied),digest(secret)]);
  let mismatch=actual.length^expected.length;
  for(let index=0;index<Math.max(actual.length,expected.length);index++)mismatch|=(actual[index]||0)^(expected[index]||0);
  return mismatch===0;
}

async function digest(value:string){return new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))}
export function json(body:unknown,status=200,extraHeaders:Record<string,string>={}){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extraHeaders}})}
