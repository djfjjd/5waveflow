import {json} from '../_shared/social-publish';

interface Env { DB?:D1Database }
export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
  if(!env.DB)return json({error:'News database is not configured'},503);
  const url=new URL(request.url),limit=Math.min(100,Math.max(1,Number(url.searchParams.get('limit')||50)));
  const category=url.searchParams.get('category'),provider=url.searchParams.get('provider'),sort=url.searchParams.get('sort')==='importance'?'importance':'latest',where:string[]=[],bindings:(string|number)[]=[];
  if(category&&['crypto','kr_market','us_market','macro','company','international'].includes(category)){where.push('n.category = ?');bindings.push(category)}
  if(provider&&['gdelt','coinness','xangle'].includes(provider)){where.push('n.provider_key = ?');bindings.push(provider)}
  const statement=env.DB.prepare(`SELECT n.id,n.event_id,n.title,n.source,n.source_url,n.published_at,n.collected_at,n.summary,n.countries_json,n.assets_json,n.category,n.importance,n.analysis_status,n.video_status,n.provider_key,n.ingestion_method,e.article_count,a.id analysis_id,a.sentiment,a.summary analysis_summary,a.generated_at analysis_generated_at FROM news_articles n JOIN news_events e ON e.id=n.event_id LEFT JOIN news_analysis a ON a.news_id=n.id ${where.length?`WHERE ${where.join(' AND ')}`:''} ORDER BY ${sort==='importance'?'n.importance DESC,n.published_at DESC':'n.published_at DESC'} LIMIT ?`);
  const result=await statement.bind(...bindings,limit).all();
  const sources=await env.DB.prepare('SELECT provider_key,display_name,enabled,interval_minutes,connection_status,last_success_at,last_error FROM news_source_settings ORDER BY provider_key').all();
  return json({items:result.results.map(row=>({...row,countries:parse(row.countries_json),assets:parse(row.assets_json),countries_json:undefined,assets_json:undefined,analysisAllowed:true,videoAllowed:true})),sources:sources.results});
};
function parse(value:unknown){try{return JSON.parse(String(value))}catch{return []}}
