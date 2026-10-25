import {json} from '../_shared/social-publish';

interface Env { DB?:D1Database }
export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
  if(!env.DB)return json({error:'News database is not configured'},503);
  const url=new URL(request.url),limit=Math.min(100,Math.max(1,Number(url.searchParams.get('limit')||50)));
  const category=url.searchParams.get('category');
  const where=category?'WHERE n.category = ?':'';
  const statement=env.DB.prepare(`SELECT n.id,n.event_id,n.title,n.source,n.source_url,n.published_at,n.collected_at,n.summary,n.countries_json,n.assets_json,n.category,n.importance,n.analysis_status,n.video_status,e.article_count,a.id analysis_id,a.sentiment,a.summary analysis_summary,a.generated_at analysis_generated_at FROM news_articles n JOIN news_events e ON e.id=n.event_id LEFT JOIN news_analysis a ON a.news_id=n.id ${where} ORDER BY n.published_at DESC LIMIT ?`);
  const result=category?await statement.bind(category,limit).all():await statement.bind(limit).all();
  return json({items:result.results.map(row=>({...row,countries:parse(row.countries_json),assets:parse(row.assets_json),countries_json:undefined,assets_json:undefined}))});
};
function parse(value:unknown){try{return JSON.parse(String(value))}catch{return []}}
