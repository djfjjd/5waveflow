import {forwardPublish,hasValidBearer,json,parsePublishRequest,SocialPublishEnv} from '../../_shared/social-publish';

export const onRequest:PagesFunction<SocialPublishEnv>=async({request,env})=>{
  if(request.method!=='POST')return json({error:'Method not allowed'},405,{Allow:'POST'});
  if(!await hasValidBearer(request,env.SNS_PUBLISH_WEBHOOK_TOKEN))return json({error:'Unauthorized'},401,{'WWW-Authenticate':'Bearer'});
  const payload=await parsePublishRequest(request);
  if(payload instanceof Response)return payload;
  return forwardPublish(payload,request,env);
};
