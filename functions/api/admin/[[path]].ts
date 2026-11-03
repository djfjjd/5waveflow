import {forwardPublish,json,parsePublishRequest,PublishPayload,SocialPublishEnv} from '../../_shared/social-publish';
import {createSignedMediaUrl,isAdminUploadedMediaKey,MAX_MP4_BYTES,MediaEnv,validateMp4} from '../../_shared/media';
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
    if(path==='video-projects/complete-upload'&&request.method==='POST')return await completeVideoUpload(request,env);
    if(path.startsWith('video-projects/')&&request.method==='GET')return await videoProjectStatus(path.slice('video-projects/'.length),request,env);
    if(path==='automation/settings'&&(request.method==='GET'||request.method==='PUT'))return await automationSettings(request,env);
    if(['publish','media','news/collect','news/analyze','news/manual','news/coinness-paste','news/sources','video-projects','video-projects/approve','video-projects/complete-upload','automation/settings'].includes(path)) return json({error:'Method not allowed'},405,{Allow:'GET, POST, PUT'});
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

async function videoProjectStatus(projectId:string,request:Request,env:Env){
  if(!env.DB)return json({error:'D1 바인딩이 설정되지 않았습니다.'},503);
  if(!/^[0-9a-f-]{36}$/i.test(projectId))return json({error:'올바르지 않은 영상 프로젝트입니다.'},400);
  const loadProject=()=>env.DB!.prepare(`SELECT p.id,p.title,p.status,p.output_r2_key,p.created_at,j.id job_id,j.status job_status,j.progress_percent,j.failure_reason,j.updated_at
    FROM content_projects p LEFT JOIN video_render_jobs j ON j.content_project_id=p.id WHERE p.id=? ORDER BY j.created_at DESC LIMIT 1`).bind(projectId).first<Record<string,unknown>>();
  let project=await loadProject();
  if(!project)return json({error:'영상 프로젝트를 찾을 수 없습니다.'},404);
  const active=['queued','generating_script','generating_audio','rendering'].includes(String(project.job_status)),updatedAt=parseDatabaseTime(project.updated_at);
  if(active&&typeof project.job_id==='string'&&updatedAt>0&&Date.now()-updatedAt>=15*60*1000){
    const reason=renderTimeoutReason(String(project.job_status));
    await env.DB.batch([env.DB.prepare("UPDATE video_render_jobs SET status='failed',failure_reason=?,attempt_count=attempt_count+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status IN ('queued','generating_script','generating_audio','rendering')").bind(reason,project.job_id),env.DB.prepare("UPDATE content_projects SET status='draft' WHERE id=?").bind(projectId)]);
    project=await loadProject();
    if(!project)return json({error:'영상 프로젝트를 찾을 수 없습니다.'},404);
  }
  let mediaUrl:string|undefined;
  if(project.status==='completed'&&typeof project.output_r2_key==='string')mediaUrl=await createSignedMediaUrl(new URL(request.url).origin,project.output_r2_key,env);
  return json({projectId:project.id,title:project.title,status:project.job_status||project.status,projectStatus:project.status,jobId:project.job_id||null,progressPercent:project.progress_percent||null,failureReason:project.failure_reason||null,updatedAt:project.updated_at||project.created_at,mediaUrl});
}

function parseDatabaseTime(value:unknown){if(typeof value!=='string')return 0;const parsed=Date.parse(value.includes('T')?value:`${value.replace(' ','T')}Z`);return Number.isFinite(parsed)?parsed:0}
function renderTimeoutReason(status:string){return status==='queued'?'렌더 단계 타임아웃: 요청 수신 후 15분 동안 상태 콜백이 없습니다.':status==='generating_script'?'렌더 단계 타임아웃: generating_script 이후 15분 동안 다음 콜백이 없습니다.':status==='generating_audio'?'렌더 단계 타임아웃: generating_audio 이후 15분 동안 다음 콜백이 없습니다.':'렌더 단계 타임아웃: rendering 이후 15분 동안 completed 콜백이 없습니다.'}

async function completeVideoUpload(request:Request,env:Env){
  if(!env.DB)return json({error:'D1 바인딩이 설정되지 않았습니다.'},503);
  if(!env.SNS_MEDIA_BUCKET)return json({error:'R2 미디어 버킷이 설정되지 않았습니다.'},503);
  const input=await request.json().catch(()=>null) as {projectId?:unknown;key?:unknown}|null;
  if(typeof input?.projectId!=='string'||!/^[0-9a-f-]{36}$/i.test(input.projectId))return json({error:'올바르지 않은 영상 프로젝트입니다.'},400);
  if(!isAdminUploadedMediaKey(input.key))return json({error:'관리자 MP4 업로드 키가 올바르지 않습니다.'},400);
  const [project,object]=await Promise.all([
    env.DB.prepare('SELECT id,title FROM content_projects WHERE id=?').bind(input.projectId).first<{id:string;title:string|null}>(),
    env.SNS_MEDIA_BUCKET.head(input.key)
  ]);
  if(!project)return json({error:'영상 프로젝트를 찾을 수 없습니다.'},404);
  if(!object)return json({error:'업로드된 MP4를 R2에서 찾을 수 없습니다.'},400);
  const job=await env.DB.prepare('SELECT id FROM video_render_jobs WHERE content_project_id=? ORDER BY created_at DESC LIMIT 1').bind(project.id).first<{id:string}>();
  const statements=[
    env.DB.prepare("UPDATE content_projects SET status='completed',output_r2_key=? WHERE id=?").bind(input.key,project.id),
    env.DB.prepare("INSERT OR IGNORE INTO media_assets(id,content_project_id,r2_key,media_type,mime_type,size_bytes,duration_seconds,rights_source) VALUES(?,?,?,'video','video/mp4',?,NULL,'admin-upload')").bind(crypto.randomUUID(),project.id,input.key,object.size)
  ];
  if(job)statements.push(env.DB.prepare("UPDATE video_render_jobs SET status='completed',failure_reason=NULL,completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP,attempt_count=attempt_count+1 WHERE id=?").bind(job.id));
  await env.DB.batch(statements);
  const mediaUrl=await createSignedMediaUrl(new URL(request.url).origin,input.key,env);
  return json({ok:true,projectId:project.id,jobId:job?.id||null,title:project.title||'최근 금융 뉴스 브리핑',status:'completed',mediaUrl});
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
