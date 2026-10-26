import type {CollectedArticle,NewsCategory} from './news';

const noise=/^(도움이 필요하세요\?|홈|소개|레퍼럴.*|차트.*지표|실시간데이터|고객센터|좋아요\s*\d*|싫어요\s*\d*|댓글\s*\d*|공유하기|인증하기)$/i;
const timeLine=/^(?:오늘\s*)?(\d{1,2}):(\d{2})$/;

export function parseCoinnessPaste(text:string,now=new Date()):CollectedArticle[]{
  const lines=text.replace(/\r/g,'').split('\n').map(line=>line.trim()).filter(Boolean),starts:number[]=[];
  lines.forEach((line,index)=>{if(timeLine.test(line))starts.push(index)});
  return starts.slice(0,200).flatMap((start,index)=>{
    const match=lines[start].match(timeLine);if(!match)return [];
    const raw=lines.slice(start+1,starts[index+1]??lines.length),hashtags=raw.filter(line=>/^#[^\s#]+/.test(line));
    const content=raw.filter(line=>!noise.test(line)&&!/^\d+$/.test(line)&&!/^#[^\s#]+/.test(line));
    if(!content.length)return [];
    const title=content[0].slice(0,500),summary=content.slice(1).join(' ').slice(0,2000),published=new Date(now);
    published.setHours(Number(match[1]),Number(match[2]),0,0);if(published.getTime()>now.getTime()+300000)published.setDate(published.getDate()-1);
    const category=classify(`${title} ${summary} ${hashtags.join(' ')}`),assets=extractAssets(`${title} ${summary}`),fingerprint=stableId(`${published.toISOString()}|${title}`);
    return [{title,summary,source:'코인니스',url:`https://coinness.com/?manual=${fingerprint}`,publishedAt:published.toISOString(),category,countries:['KR'],assets,importance:importance(title),providerKey:'coinness',ingestionMethod:'manual'}];
  });
}
function classify(value:string):NewsCategory{return /비트코인|이더리움|코인|가상자산|블록체인|BTC|ETH/i.test(value)?'crypto':/금리|연준|FOMC|CPI|환율|달러/i.test(value)?'macro':/나스닥|S&P|미 증시/i.test(value)?'us_market':/코스피|코스닥|한국 증시/i.test(value)?'kr_market':'crypto'}
function extractAssets(value:string){const result:string[]=[];if(/비트코인|BTC/i.test(value))result.push('BTC');if(/이더리움|ETH/i.test(value))result.push('ETH');return result}
function importance(value:string){return /해킹|상장폐지|규제|승인|금리|FOMC|ETF|파산/i.test(value)?4:3}
function stableId(value:string){let hash=2166136261;for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619)}return (hash>>>0).toString(16)}
