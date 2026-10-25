import {searchNaverNews,NaverNewsEnv} from '../../_shared/naver-news';
import {json} from '../../_shared/social-publish';

export const onRequestGet:PagesFunction<NaverNewsEnv>=async({request,env})=>{
  try{const query=new URL(request.url).searchParams.get('query')||undefined;const items=await searchNaverNews(env,query);if(env.DB)await env.DB.batch([env.DB.prepare("UPDATE news_source_settings SET connection_status='connected',last_attempt_at=CURRENT_TIMESTAMP,last_success_at=CURRENT_TIMESTAMP,last_error=NULL,retry_count=0 WHERE provider_key='naver'"),env.DB.prepare("INSERT INTO api_usage_logs(provider,operation,units,estimated_cost_usd) VALUES('naver','news.search',?,0)").bind(items.length)]);return json({items,provider:'naver',usagePolicy:'display-only; no storage or AI processing'},200,{'Cache-Control':'private, no-store'})}catch(error){if(env.DB)await env.DB.prepare("UPDATE news_source_settings SET connection_status='error',last_attempt_at=CURRENT_TIMESTAMP,last_error='Provider request failed',retry_count=retry_count+1 WHERE provider_key='naver'").run();return json({error:error instanceof Error?error.message:'NAVER news unavailable',items:[]},503)}
};
