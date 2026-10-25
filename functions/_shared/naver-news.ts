import type {D1Database} from '@cloudflare/workers-types';

export interface NaverNewsEnv {DB?:D1Database;NAVER_API_CLIENT_ID?:string;NAVER_API_CLIENT_SECRET?:string}
export type NaverNewsItem={id:string;title:string;source:string;source_url:string;published_at:string;category:string;importance:number;analysis_status:'not_allowed';video_status:'not_allowed';assets:string[];article_count:1;provider_key:'naver';analysisAllowed:false;videoAllowed:false};

export async function searchNaverNews(env:NaverNewsEnv,queryOverride?:string,fetcher:typeof fetch=fetch){
  if(!env.NAVER_API_CLIENT_ID||!env.NAVER_API_CLIENT_SECRET)throw new Error('NAVER API HUB credentials are not configured');
  const terms=queryOverride?[queryOverride]:await configuredTerms(env.DB);
  const results:NaverNewsItem[]=[];
  for(const term of terms.slice(0,10)){
    const url=new URL('https://naverapihub.apigw.ntruss.com/search/v1/news');url.search=new URLSearchParams({query:term,display:'20',start:'1',sort:'date',format:'json'}).toString();
    const response=await fetcher(url,{headers:{'X-NCP-APIGW-API-KEY-ID':env.NAVER_API_CLIENT_ID,'X-NCP-APIGW-API-KEY':env.NAVER_API_CLIENT_SECRET,accept:'application/json'},signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error(`NAVER API HUB ${response.status}`);
    const body=await response.json() as {items?:Array<{title?:string;originallink?:string;link?:string;pubDate?:string}>};
    for(const item of body.items||[]){const sourceUrl=safeUrl(item.originallink||item.link);const published=Date.parse(item.pubDate||'');if(!item.title||!sourceUrl||!Number.isFinite(published)||published>Date.now()+300000)continue;const title=stripTags(item.title);results.push({id:`naver:${await hash(sourceUrl)}`,title,source:new URL(sourceUrl).hostname,source_url:sourceUrl,published_at:new Date(published).toISOString(),category:classify(title),importance:importance(title),analysis_status:'not_allowed',video_status:'not_allowed',assets:assets(title),article_count:1,provider_key:'naver',analysisAllowed:false,videoAllowed:false})}
  }
  return [...new Map(results.map(item=>[item.source_url,item])).values()].sort((a,b)=>b.published_at.localeCompare(a.published_at));
}

async function configuredTerms(db?:D1Database){if(!db)return defaultTerms;const row=await db.prepare("SELECT search_terms_json FROM news_source_settings WHERE provider_key='naver'").first<{search_terms_json:string}>();try{const parsed=JSON.parse(row?.search_terms_json||'[]');return Array.isArray(parsed)&&parsed.length?parsed.map(String):defaultTerms}catch{return defaultTerms}}
const defaultTerms=['주식','금융','환율','금리','기업 실적','경제정책'];
function stripTags(value:string){return value.replace(/<[^>]*>/g,'').replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim().slice(0,500)}
function safeUrl(value?:string){if(!value)return null;try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.toString():null}catch{return null}}
function classify(title:string){return /코인|비트코인|이더리움|가상자산/.test(title)?'crypto':/환율|금리|물가|정부|정책/.test(title)?'macro':/나스닥|미국 증시|S&P/.test(title)?'us_market':'kr_market'}
function assets(title:string){const output:string[]=[];if(/비트코인/.test(title))output.push('BTC');if(/이더리움/.test(title))output.push('ETH');if(/삼성전자/.test(title))output.push('KRX:005930');if(/SK하이닉스/.test(title))output.push('KRX:000660');return output}
function importance(title:string){return /금리|FOMC|CPI|규제|실적|인수|합병|환율/.test(title)?4:3}
async function hash(value:string){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));return [...bytes].slice(0,12).map(byte=>byte.toString(16).padStart(2,'0')).join('')}
