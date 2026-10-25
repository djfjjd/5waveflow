import {forwardPublish,hasValidBearer,json,parsePublishRequest,Platform,SocialPublishEnv,supportedPlatforms} from '../../_shared/social-publish';

interface Env extends SocialPublishEnv { DB?:D1Database }
type StatusEvent={event?:unknown;jobId?:unknown;platform?:unknown;status?:unknown;remotePostId?:unknown;postUrl?:unknown;error?:unknown};

export const onRequest:PagesFunction<Env>=async({request,env})=>{
  if(request.method!=='POST')return json({error:'Method not allowed'},405,{Allow:'POST'});
  if(!await hasValidBearer(request,env.SNS_PUBLISH_WEBHOOK_TOKEN))return json({error:'Unauthorized'},401,{'WWW-Authenticate':'Bearer'});
  const preview=await request.clone().json().catch(()=>null) as StatusEvent|null;
  if(preview?.event==='publish.status')return updateStatus(preview,env);
  const payload=await parsePublishRequest(request);
  if(payload instanceof Response)return payload;
  return forwardPublish(payload,request,env);
};

async function updateStatus(event:StatusEvent,env:Env){
  if(!env.DB)return json({error:'SNS 게시 기록용 D1 바인딩이 설정되지 않았습니다.'},503);
  if(typeof event.jobId!=='string'||typeof event.platform!=='string'||!supportedPlatforms.includes(event.platform as Platform)||!['processing','succeeded','failed'].includes(String(event.status)))return json({error:'Invalid status event'},400);
  const status=event.status as 'processing'|'succeeded'|'failed';
  const remotePostId=typeof event.remotePostId==='string'?event.remotePostId.slice(0,300):null;
  const postUrl=typeof event.postUrl==='string'&&isHttps(event.postUrl)?event.postUrl.slice(0,2000):null;
  const failure=status==='failed'&&typeof event.error==='string'?event.error.slice(0,500):null;
  if(status==='succeeded'&&!remotePostId&&!postUrl)return json({error:'게시 성공은 플랫폼의 게시물 ID 또는 URL로 확인되어야 합니다.'},400);
  const updated=await env.DB.prepare('UPDATE sns_publish_platforms SET status = ?, remote_post_id = ?, post_url = ?, failure_reason = ?, attempt_count = attempt_count + 1, updated_at = CURRENT_TIMESTAMP WHERE job_id = ? AND platform = ?').bind(status,remotePostId,postUrl,failure,event.jobId,event.platform).run();
  if(!updated.meta.changes)return json({error:'Publish job or platform not found'},404);
  const counts=await env.DB.prepare("SELECT COUNT(*) total, SUM(status = 'succeeded') succeeded, SUM(status = 'failed') failed, SUM(status IN ('pending','processing')) active FROM sns_publish_platforms WHERE job_id = ?").bind(event.jobId).first<{total:number;succeeded:number;failed:number;active:number}>();
  const jobStatus=counts?.active?'dispatched':counts?.succeeded===counts?.total?'succeeded':counts?.failed===counts?.total?'failed':'partial';
  await env.DB.prepare('UPDATE sns_publish_jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE job_id = ?').bind(jobStatus,event.jobId).run();
  return json({ok:true,jobId:event.jobId,platform:event.platform,status,jobStatus});
}

function isHttps(value:string){try{return new URL(value).protocol==='https:'}catch{return false}}
