import {forwardPublish,json,parsePublishRequest,PublishPayload,SocialPublishEnv} from '../../_shared/social-publish';
import {createSignedMediaUrl,MAX_MP4_BYTES,MediaEnv,validateMp4} from '../../_shared/media';
import {analyzeNews,approveVideoProject,automationSettings,collectNews,createVideoProject,importCoinnessPaste,newsSourceSettings,registerManualNews,WorkflowEnv} from '../../_shared/workflows';
import {isAllowedAdminEmail} from '../../_shared/admin-auth';

interface Env extends SocialPublishEnv,MediaEnv,WorkflowEnv { CF_ACCESS_TEAM_DOMAIN?:string; CF_ACCESS_AUD?:string; ADMIN_ALLOWED_EMAIL?:string }
type Claims={aud?:string[]|string;exp?:number;iss?:string;email?:string};
type Jwk={kid?:string;kty:string;n?:string;e?:string;alg?:string;use?:string};

export const onRequest:PagesFunction<Env>=async({request,env})=>{
  let claims:Claims={exp:Math.floor(Date.now()/1000)+3600};
  if(env.CF_ACCESS_TEAM_DOMAIN&&env.CF_ACCESS_AUD){const jwt=request.headers.get('Cf-Access-Jwt-Assertion')||readCookie(request.headers.get('cookie'),'CF_Authorization');if(!jwt)return json({error:'관리자 이메일 인증이 필요합니다.'},401);try{claims=await verifyAccessJwt(jwt,normalizeDomain(env.CF_ACCESS_TEAM_DOMAIN),env.CF_ACCESS_AUD)}catch{return json({error:'관리자 이메일 인증이 필요합니다.'},401)}}
  else claims.email=request.headers.get('Cf-Access-Authenticated-User-Email')||undefined;
  if(!claims.email)return json({error:'관리자 이메일 인증이 필요합니다.'},401);
  if(!isAllowedAdminEmail(claims.email,env.ADMIN_ALLOWED_EMAIL))return json({error:'허용되지 않은 이메일입니다.'},403);
  const path=new URL(request.url).pathname.replace(/^\/api\/admin\/?/,'');
  try{
    if(path==='publish'&&request.method==='POST') return await publish(request,env,claims);
    if(path==='media'&&request.method==='POST') return await uploadMedia(request,env);
    if(path==='news/collect'&&request.method==='POST')return await collectNews(env);
    if(path==='news/analyze'&&request.method==='POST')return await analyzeNews(request,env);
    if(path==='news/manual'&&request.method==='POST')return await registerManualNews(request,env);
    if(path==='news/coinness-paste'&&request.method==='POST')return await importCoinnessPaste(request,env);
    if(path==='news/sources'&&(request.method==='GET'||request.method==='PUT'))return await newsSourceSettings(request,env);
    if(path==='video-projects'&&request.method==='POST')return await createVideoProject(request,env);
    if(path==='video-projects/approve'&&request.method==='POST')return await approveVideoProject(request,env);
    if(path==='automation/settings'&&(request.method==='GET'||request.method==='PUT'))return await automationSettings(request,env);
    if(['publish','media','news/collect','news/analyze','news/manual','news/coinness-paste','news/sources','video-projects','video-projects/approve','automation/settings'].includes(path)) return json({error:'Method not allowed'},405,{Allow:'GET, POST, PUT'});
    return json({ok:true,message:'Admin API foundation',databaseBound:Boolean(env.DB),identityVerified:true,expiresAt:claims.exp});
  }catch{return json({error:'관리자 요청을 처리하지 못했습니다.'},500)}
};

async function publish(request:Request,env:Env,claims:Claims){
  if(!env.DB)return json({error:'SNS 게시 기록용 D1 바인딩이 설정되지 않았습니다.'},503);
  const payload=await parsePublishRequest(request);
  if(payload instanceof Response)return payload;
  payload.adminTokenExpiresAt=claims.exp;
  const idempotencyKey=request.headers.get('x-idempotency-key')||payload.jobId;
  if(idempotencyKey.length>100)return json({error:'잘못된 중복 방지 키입니다.'},400);
  const prepared=await preparePublishJob(env.DB,payload,idempotencyKey);
  payload.jobId=prepared.jobId;
  if(prepared.duplicate)return json({ok:true,duplicate:true,jobId:prepared.jobId,platforms:payload.platforms,message:'이미 접수된 게시 요청입니다.'},200);
  const result=await forwardPublish(payload,request,env);
  await env.DB.prepare('UPDATE sns_publish_jobs SET status = ?, failure_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE job_id = ?').bind(result.ok?'dispatched':'failed',result.ok?null:'Webhook dispatch failed',payload.jobId).run();
  if(!result.ok)await env.DB.prepare("UPDATE sns_publish_platforms SET status = 'failed', failure_reason = 'Webhook dispatch failed', updated_at = CURRENT_TIMESTAMP WHERE job_id = ?").bind(payload.jobId).run();
  return result;
}

async function uploadMedia(request:Request,env:Env){
  if(!env.SNS_MEDIA_BUCKET)return json({error:'R2 미디어 버킷이 설정되지 않았습니다.'},503);
  if(!env.SNS_MEDIA_SIGNING_SECRET||env.SNS_MEDIA_SIGNING_SECRET.length<32)return json({error:'미디어 URL 서명 Secret이 설정되지 않았습니다.'},503);
  const contentLength=Number(request.headers.get('content-length')||0);
  if(contentLength>MAX_MP4_BYTES+1024*1024)return json({error:'업로드 요청 크기가 제한을 초과했습니다.'},413);
  const form=await request.formData().catch(()=>null);
  const file=form?.get('file');
  if(!(file instanceof File))return json({error:'MP4 파일을 선택해 주세요.'},400);
  const invalid=await validateMp4(file);
  if(invalid)return json({error:invalid},400);
  const now=new Date(),key=`sns/${now.getUTCFullYear()}/${String(now.getUTCMonth()+1).padStart(2,'0')}/${crypto.randomUUID()}.mp4`;
  await env.SNS_MEDIA_BUCKET.put(key,file.stream(),{httpMetadata:{contentType:'video/mp4',cacheControl:'private, no-store'},customMetadata:{originalName:file.name.slice(0,200),uploadedAt:now.toISOString()}});
  const mediaUrl=await createSignedMediaUrl(new URL(request.url).origin,key,env);
  return json({ok:true,key,mediaUrl,expiresIn:Number(env.SNS_MEDIA_URL_TTL_SECONDS||86400),size:file.size},201);
}

async function preparePublishJob(db:D1Database,payload:PublishPayload,idempotencyKey:string){
  const existing=await db.prepare('SELECT job_id,status FROM sns_publish_jobs WHERE idempotency_key = ?').bind(idempotencyKey).first<{job_id:string;status:string}>();
  if(existing){
    if(existing.status!=='failed')return {jobId:existing.job_id,duplicate:true};
    await db.batch([
      db.prepare("UPDATE sns_publish_jobs SET status = 'pending', failure_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE job_id = ?").bind(existing.job_id),
      db.prepare("UPDATE sns_publish_platforms SET status = 'pending', failure_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE job_id = ? AND status = 'failed'").bind(existing.job_id)
    ]);
    return {jobId:existing.job_id,duplicate:false};
  }
  try{
    await db.prepare("INSERT INTO sns_publish_jobs(job_id,idempotency_key,media_url,title,caption,status) VALUES(?,?,?,?,?,'pending')").bind(payload.jobId,idempotencyKey,payload.mediaUrl,payload.title,payload.caption).run();
    await db.batch(payload.platforms.map(platform=>db.prepare("INSERT INTO sns_publish_platforms(job_id,platform,status) VALUES(?,?,'pending')").bind(payload.jobId,platform)));
    return {jobId:payload.jobId,duplicate:false};
  }catch{
    const raced=await db.prepare('SELECT job_id FROM sns_publish_jobs WHERE idempotency_key = ?').bind(idempotencyKey).first<{job_id:string}>();
    if(raced)return {jobId:raced.job_id,duplicate:true};
    throw new Error('Could not persist publish job');
  }
}

async function verifyAccessJwt(token:string,teamDomain:string,expectedAud:string){
  const parts=token.split('.');
  if(parts.length!==3) throw new Error('Malformed token');
  const header=JSON.parse(decode(parts[0])) as {alg?:string;kid?:string};
  const claims=JSON.parse(decode(parts[1])) as Claims;
  if(header.alg!=='RS256'||!header.kid) throw new Error('Unsupported token');
  const certsResponse=await fetch(`https://${teamDomain}/cdn-cgi/access/certs`,{headers:{accept:'application/json'},signal:AbortSignal.timeout(5000)});
  if(!certsResponse.ok) throw new Error('JWKS unavailable');
  const certs=await certsResponse.json() as {keys:Jwk[]};
  const jwk=certs.keys.find(key=>key.kid===header.kid);
  if(!jwk) throw new Error('Signing key not found');
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,bytes(parts[2]),new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  const aud=Array.isArray(claims.aud)?claims.aud:[claims.aud];
  if(!valid||!aud.includes(expectedAud)||!claims.exp||claims.exp*1000<Date.now()||claims.iss!==`https://${teamDomain}`) throw new Error('Invalid claims');
  return claims;
}
function normalizeDomain(value:string){return value.replace(/^https?:\/\//,'').replace(/\/$/,'')}
function readCookie(header:string|null,name:string){if(!header)return '';for(const part of header.split(';')){const index=part.indexOf('=');if(index<0)continue;if(part.slice(0,index).trim()===name)return part.slice(index+1).trim()}return ''}
function decode(value:string){return new TextDecoder().decode(bytes(value))}
function bytes(value:string){const normalized=value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=');return Uint8Array.from(atob(normalized),c=>c.charCodeAt(0))}
