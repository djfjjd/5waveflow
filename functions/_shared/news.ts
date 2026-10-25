import {json} from './social-publish';
import type {D1Database} from '@cloudflare/workers-types';

export type NewsCategory='us_market'|'kr_market'|'crypto'|'macro'|'company'|'international';
export interface CollectedArticle {title:string;source:string;url:string;publishedAt:string;category:NewsCategory;countries:string[];assets:string[];importance:number;providerKey?:'gdelt'|'coinness'|'xangle';ingestionMethod?:'api'|'manual'}
export async function collectFromGdelt(fetcher:typeof fetch=fetch){
  const url=new URL('https://api.gdeltproject.org/api/v2/doc/doc');
  url.search=new URLSearchParams({query:'("S&P 500" OR NASDAQ OR KOSPI OR KOSDAQ OR Bitcoin OR Ethereum OR FOMC OR CPI OR earnings)',mode:'ArtList',format:'json',maxrecords:'100',sort:'HybridRel',timespan:'1d'}).toString();
  const response=await fetcher(url,{headers:{accept:'application/json','user-agent':'5waveflow-news-collector/1.0'},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(`GDELT ${response.status}`);
  const body=await response.json() as {articles?:Array<{title?:string;url?:string;domain?:string;seendate?:string}>};
  return (body.articles||[]).flatMap(item=>{
    if(!item.title||!item.url||!item.seendate)return [];
    const published=parseGdeltDate(item.seendate);if(!published||!isPublicationTimeValid(published))return [];
    let sourceUrl:URL;try{sourceUrl=new URL(item.url)}catch{return []}if(!['http:','https:'].includes(sourceUrl.protocol))return [];
    const classification=classify(item.title);
    return [{title:item.title.trim().slice(0,500),source:(item.domain||sourceUrl.hostname).slice(0,200),url:sourceUrl.toString(),publishedAt:published,...classification,importance:importance(item.title)} satisfies CollectedArticle];
  });
}

export async function storeArticles(db:D1Database,articles:CollectedArticle[]){
  let inserted=0,duplicates=0;
  for(const article of articles){
    const normalizedUrl=canonicalUrl(article.url),contentHash=await sha256(normalizedUrl),fingerprint=await eventFingerprint(article.title);
    const existing=await db.prepare('SELECT id FROM news_articles WHERE content_hash = ? OR source_url = ?').bind(contentHash,normalizedUrl).first();
    if(existing){duplicates++;continue}
    const event=await db.prepare('SELECT id FROM news_events WHERE fingerprint = ?').bind(fingerprint).first<{id:string}>();
    const eventId=event?.id||crypto.randomUUID();
    if(event)await db.prepare('UPDATE news_events SET article_count=article_count+1,latest_published_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(article.publishedAt,eventId).run();
    else await db.prepare('INSERT INTO news_events(id,fingerprint,headline,category,importance,first_published_at,latest_published_at) VALUES(?,?,?,?,?,?,?)').bind(eventId,fingerprint,article.title,article.category,article.importance,article.publishedAt,article.publishedAt).run();
    await db.prepare('INSERT INTO news_articles(id,event_id,title,source,source_url,published_at,countries_json,assets_json,category,importance,content_hash,provider_key,ingestion_method) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),eventId,article.title,article.source,normalizedUrl,article.publishedAt,JSON.stringify(article.countries),JSON.stringify(article.assets),article.category,article.importance,contentHash,article.providerKey||'gdelt',article.ingestionMethod||'api').run();inserted++;
  }
  return {fetched:articles.length,inserted,duplicates};
}

export function validateAnalysis(value:unknown){
  if(!value||typeof value!=='object')return null;
  const data=value as Record<string,unknown>,required=['summary','importanceReason','sentiment','directAssets','indirectAssets','impactPath','shortTermScenario','mediumTermScenario','pricedInAssessment','counterScenario','invalidationConditions','technicalAlignment','assetImpacts'];
  if(required.some(key=>!(key in data))||!['positive','negative','neutral','mixed'].includes(String(data.sentiment))||!Array.isArray(data.directAssets)||!Array.isArray(data.indirectAssets)||!Array.isArray(data.assetImpacts))return null;
  const clean=(key:string,max=3000)=>String(data[key]||'').slice(0,max);
  return {summary:clean('summary'),importanceReason:clean('importanceReason'),sentiment:String(data.sentiment),directAssets:data.directAssets.map(String).slice(0,30),indirectAssets:data.indirectAssets.map(String).slice(0,30),impactPath:clean('impactPath'),shortTermScenario:clean('shortTermScenario'),mediumTermScenario:clean('mediumTermScenario'),pricedInAssessment:clean('pricedInAssessment'),counterScenario:clean('counterScenario'),invalidationConditions:clean('invalidationConditions'),technicalAlignment:data.technicalAlignment,assetImpacts:data.assetImpacts};
}

export function noStore(body:unknown,status=200){return json(body,status)}
function importance(title:string){const value=title.toLowerCase();return /fomc|rate decision|cpi|war|tariff|earnings|merger|regulation/.test(value)?4:/nasdaq|kospi|bitcoin|ethereum|inflation/.test(value)?3:2}
function classify(title:string):Pick<CollectedArticle,'category'|'countries'|'assets'>{const value=title.toLowerCase();if(/bitcoin|ethereum|crypto/.test(value))return{category:'crypto',countries:[],assets:['BTC','ETH']};if(/kospi|kosdaq|samsung|sk hynix/.test(value))return{category:'kr_market',countries:['KR'],assets:['KOSPI','KOSDAQ']};if(/fomc|cpi|ppi|interest rate|treasury|inflation/.test(value))return{category:'macro',countries:['US'],assets:['USD/KRW','SPX','NASDAQ']};return{category:/earnings|merger|acquisition/.test(value)?'company':'us_market',countries:['US'],assets:['SPX','NASDAQ']}}
export function parseGdeltDate(value:string){const match=value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);if(!match)return null;return new Date(Date.UTC(+match[1],+match[2]-1,+match[3],+match[4],+match[5],+match[6])).toISOString()}
export function isPublicationTimeValid(value:string,now=Date.now()){const time=Date.parse(value);return Number.isFinite(time)&&time<=now+5*60_000&&time>=now-7*86400_000}
export function canonicalUrl(value:string){const url=new URL(value);url.hash='';for(const key of [...url.searchParams.keys()])if(/^utm_|^(fbclid|gclid)$/i.test(key))url.searchParams.delete(key);return url.toString()}
async function eventFingerprint(title:string){return sha256(title.toLowerCase().replace(/[^a-z0-9가-힣 ]/g,' ').split(/\s+/).filter(word=>word.length>2).sort().slice(0,12).join(' '))}
async function sha256(value:string){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));return [...bytes].map(byte=>byte.toString(16).padStart(2,'0')).join('')}
