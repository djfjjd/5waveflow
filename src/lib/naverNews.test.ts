import {describe,expect,it,vi} from 'vitest';
import {searchNaverNews} from '../../functions/_shared/naver-news';

describe('NAVER API HUB news adapter',()=>{
  it('uses official headers, strips markup and does not mark results AI-ready',async()=>{
    const fetcher=vi.fn(async(_input:RequestInfo|URL,init?:RequestInit)=>{const headers=new Headers(init?.headers);expect(headers.get('X-NCP-APIGW-API-KEY-ID')).toBe('client');expect(headers.get('X-NCP-APIGW-API-KEY')).toBe('secret');return new Response(JSON.stringify({items:[{title:'<b>금리</b> 결정',originallink:'https://news.example.com/a',pubDate:new Date(Date.now()-60000).toUTCString()}]}),{status:200,headers:{'content-type':'application/json'}})}) as typeof fetch;
    const items=await searchNaverNews({NAVER_API_CLIENT_ID:'client',NAVER_API_CLIENT_SECRET:'secret'},'금리',fetcher);
    expect(items[0]).toMatchObject({title:'금리 결정',provider_key:'naver',analysisAllowed:false,videoAllowed:false});
  });
  it('requires credentials instead of returning fake news',async()=>{await expect(searchNaverNews({},'주식')).rejects.toThrow('credentials')});
});
