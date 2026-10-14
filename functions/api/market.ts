import {indicators} from '../../src/lib/indicators';
import {analyzePatterns} from '../../src/lib/patterns';

interface Env { BINANCE_API_BASE?: string }
type Candle={time:number;open:number;high:number;low:number;close:number;volume:number};
type ProviderData={provider:'Binance Spot'|'Upbit KRW';quoteCurrency:'USDT'|'KRW';ticker:{price:number;changePercent:number;volume:number;high:number;low:number};candles:Candle[]};
type UpbitCandle={candle_date_time_utc:string;opening_price:number;high_price:number;low_price:number;trade_price:number;candle_acc_trade_volume:number};
type UpbitTicker={trade_price:number;signed_change_rate:number;acc_trade_price_24h:number;high_price:number;low_price:number};
const allowedSymbols=new Set(['BTCUSDT','ETHUSDT']);
const allowedIntervals=new Set(['1m','5m','15m','30m','1h','4h','1d','1w']);

export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
  const url=new URL(request.url);
  const symbol=(url.searchParams.get('symbol')||'BTCUSDT').toUpperCase();
  const interval=url.searchParams.get('interval')||'1h';
  if(!allowedSymbols.has(symbol)||!allowedIntervals.has(interval))return json({error:'Unsupported symbol or interval'},400);
  try{
    let data:ProviderData;
    try{data=await fetchBinance(env.BINANCE_API_BASE||'https://data-api.binance.vision',symbol,interval)}
    catch{data=await fetchUpbit(symbol,interval)}
    const closedCandles=onlyClosedCandles(data.candles,interval,Date.now());
    if(closedCandles.length<50)throw new Error('Insufficient closed candles');
    const updatedAt=new Date().toISOString();
    const lastClosed=closedCandles.at(-1)!;
    const dataStatus=Date.now()-(lastClosed.time+intervalSeconds(interval))*1000>intervalSeconds(interval)*2000?'stale':'fresh';
    return json({symbol,interval,provider:data.provider,quoteCurrency:data.quoteCurrency,ticker:{symbol,price:data.ticker.price,changePercent:data.ticker.changePercent,volume:data.ticker.volume,high:data.ticker.high,low:data.ticker.low,updatedAt},candles:data.candles,indicators:indicators(closedCandles),analysisTime:interval,updatedAt,dataTimestamp:new Date(lastClosed.time*1000).toISOString(),dataStatus,dataPoints:closedCandles.length,currentCandleComplete:closedCandles.length===data.candles.length,analysis:analyzePatterns(closedCandles),probability:null,probabilityStatus:'unavailable'},200,{'Cache-Control':'public, max-age=30, s-maxage=30'});
  }catch(error){return json({error:'Market data provider unavailable',detail:error instanceof Error?error.message:'Unknown error'},502)}
};

async function fetchBinance(base:string,symbol:string,interval:string):Promise<ProviderData>{
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),8000);
  try{
    const[tickerResponse,klineResponse]=await Promise.all([fetch(`${base}/api/v3/ticker/24hr?symbol=${symbol}`,{signal:controller.signal}),fetch(`${base}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`,{signal:controller.signal})]);
    if(!tickerResponse.ok||!klineResponse.ok)throw new Error(`Binance response ${tickerResponse.status}/${klineResponse.status}`);
    const ticker=await tickerResponse.json() as Record<string,string>;
    const raw=await klineResponse.json() as unknown[][];
    const candles=raw.map(row=>({time:Math.floor(Number(row[0])/1000),open:Number(row[1]),high:Number(row[2]),low:Number(row[3]),close:Number(row[4]),volume:Number(row[5])}));
    if(candles.length<200)throw new Error('Insufficient Binance candles');
    return{provider:'Binance Spot',quoteCurrency:'USDT',ticker:{price:Number(ticker.lastPrice),changePercent:Number(ticker.priceChangePercent),volume:Number(ticker.quoteVolume),high:Number(ticker.highPrice),low:Number(ticker.lowPrice)},candles};
  }finally{clearTimeout(timer)}
}

async function fetchUpbit(symbol:string,interval:string):Promise<ProviderData>{
  const market=`KRW-${symbol.replace('USDT','')}`;
  const path=interval==='1d'?'days':interval==='1w'?'weeks':`minutes/${({ '1m':1,'5m':5,'15m':15,'30m':30,'1h':60,'4h':240 } as Record<string,number>)[interval]}`;
  const tickerPromise=fetchJson<UpbitTicker[]>(`https://api.upbit.com/v1/ticker?markets=${market}`);
  const rows:UpbitCandle[]=[];
  let to:string|undefined;
  for(let page=0;page<3;page++){
    const query=new URLSearchParams({market,count:'200'});
    if(to)query.set('to',to);
    const batch=await fetchJson<UpbitCandle[]>(`https://api.upbit.com/v1/candles/${path}?${query}`);
    if(!batch.length)break;
    rows.push(...batch);
    to=`${batch.at(-1)!.candle_date_time_utc}Z`;
    if(batch.length<200)break;
  }
  const ticker=(await tickerPromise)[0];
  const candles=rows.map(row=>({time:Math.floor(Date.parse(`${row.candle_date_time_utc}Z`)/1000),open:row.opening_price,high:row.high_price,low:row.low_price,close:row.trade_price,volume:row.candle_acc_trade_volume})).filter(candle=>Object.values(candle).every(Number.isFinite)).sort((a,b)=>a.time-b.time).filter((candle,index,array)=>index===0||candle.time!==array[index-1].time).slice(-500);
  if(!ticker||candles.length<200)throw new Error('Insufficient Upbit market data');
  return{provider:'Upbit KRW',quoteCurrency:'KRW',ticker:{price:ticker.trade_price,changePercent:ticker.signed_change_rate*100,volume:ticker.acc_trade_price_24h,high:ticker.high_price,low:ticker.low_price},candles};
}

async function fetchJson<T>(url:string):Promise<T>{const response=await fetch(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error(`Upbit response ${response.status}`);return response.json() as Promise<T>}
function intervalSeconds(interval:string){return({ '1m':60,'5m':300,'15m':900,'30m':1800,'1h':3600,'4h':14400,'1d':86400,'1w':604800 } as Record<string,number>)[interval]}
export function onlyClosedCandles(candles:Candle[],interval:string,now:number){const duration=intervalSeconds(interval);return candles.filter(candle=>(candle.time+duration)*1000<=now)}
function json(body:unknown,status=200,extra:Record<string,string>={}){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json;charset=UTF-8','X-Content-Type-Options':'nosniff',...extra}})}
