import {hasValidBearer,json} from '../../_shared/social-publish';

interface MediaBucket {head(key:string):Promise<{size:number}|null>}
interface Env {DB?:D1Database;SNS_MEDIA_BUCKET?:MediaBucket;VIDEO_RENDER_WEBHOOK_TOKEN?:string}
export const onRequestPost:PagesFunction<Env>=async({request,env})=>{
  if(!await hasValidBearer(request,env.VIDEO_RENDER_WEBHOOK_TOKEN))return json({error:'Unauthorized'},401,{'WWW-Authenticate':'Bearer'});
  if(!env.DB)return json({error:'D1 is not configured'},503);
  const input=await request.json().catch(()=>null) as {jobId?:unknown;status?:unknown;r2Key?:unknown;error?:unknown;durationSeconds?:unknown;estimatedCostUsd?:unknown}|null;
  if(typeof input?.jobId!=='string'||!['generating_script','generating_audio','rendering','completed','failed'].includes(String(input.status)))return json({error:'Invalid render status event'},400);
  const status=String(input.status),job=await env.DB.prepare('SELECT content_project_id FROM video_render_jobs WHERE id=?').bind(input.jobId).first<{content_project_id:string}>();if(!job)return json({error:'Render job not found'},404);
  if(status==='completed'){
    if(typeof input.r2Key!=='string'||!env.SNS_MEDIA_BUCKET)return json({error:'Completed render requires an R2 object'},400);
    const object=await env.SNS_MEDIA_BUCKET.head(input.r2Key);if(!object)return json({error:'Rendered R2 object was not found'},400);
    await env.DB.batch([env.DB.prepare("UPDATE video_render_jobs SET status='completed',completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP,attempt_count=attempt_count+1 WHERE id=?").bind(input.jobId),env.DB.prepare("UPDATE content_projects SET status='completed',output_r2_key=?,estimated_cost_usd=? WHERE id=?").bind(input.r2Key,Number(input.estimatedCostUsd||0),job.content_project_id),env.DB.prepare("INSERT OR IGNORE INTO media_assets(id,content_project_id,r2_key,media_type,mime_type,size_bytes,duration_seconds,rights_source) VALUES(?,?,?,'video','video/mp4',?,?, 'original-render')").bind(crypto.randomUUID(),job.content_project_id,input.r2Key,object.size,Number(input.durationSeconds||0))]);
  }else if(status==='failed')await env.DB.batch([env.DB.prepare("UPDATE video_render_jobs SET status='failed',failure_reason=?,updated_at=CURRENT_TIMESTAMP,attempt_count=attempt_count+1 WHERE id=?").bind(String(input.error||'Renderer failed').slice(0,500),input.jobId),env.DB.prepare("UPDATE content_projects SET status='failed' WHERE id=?").bind(job.content_project_id)]);
  else await env.DB.prepare('UPDATE video_render_jobs SET status=?,started_at=COALESCE(started_at,CURRENT_TIMESTAMP),updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(status,input.jobId).run();
  return json({ok:true,jobId:input.jobId,status});
};
