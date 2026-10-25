import {MediaEnv,verifySignedMediaUrl} from '../../_shared/media';
import {json} from '../../_shared/social-publish';

export const onRequest:PagesFunction<MediaEnv>=async({request,env})=>{
  if(request.method!=='GET'&&request.method!=='HEAD')return json({error:'Method not allowed'},405,{Allow:'GET, HEAD'});
  if(!env.SNS_MEDIA_BUCKET)return json({error:'Media storage is not configured'},503);
  const url=new URL(request.url);
  const encodedPath=url.pathname.replace(/^\/api\/media\/?/,'');
  let key:string;
  try{key=encodedPath.split('/').map(decodeURIComponent).join('/')}catch{return json({error:'Invalid media path'},400)}
  if(!key||key.includes('..')||!await verifySignedMediaUrl(key,url.searchParams.get('expires'),url.searchParams.get('signature'),env.SNS_MEDIA_SIGNING_SECRET))return json({error:'Media URL is invalid or expired'},403);
  if(request.method==='HEAD'){
    const object=await env.SNS_MEDIA_BUCKET.head(key);
    if(!object)return json({error:'Media not found'},404);
    const headers=new Headers({'Accept-Ranges':'bytes','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'inline','Content-Length':String(object.size)});
    object.writeHttpMetadata(headers);headers.set('etag',object.httpEtag);
    return new Response(null,{status:200,headers});
  }
  const object=await env.SNS_MEDIA_BUCKET.get(key,{range:request.headers});
  if(!object)return json({error:'Media not found'},404);
  const headers=new Headers({'Accept-Ranges':'bytes','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'inline'});
  object.writeHttpMetadata(headers);headers.set('etag',object.httpEtag);
  if(object.range&&'offset' in object.range){const length='length' in object.range&&object.range.length?object.range.length:object.size-object.range.offset;headers.set('Content-Range',`bytes ${object.range.offset}-${object.range.offset+length-1}/${object.size}`)}
  return new Response(object.body,{status:object.range?206:200,headers});
};
