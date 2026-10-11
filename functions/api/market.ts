interface Env { BINANCE_API_BASE?: string }
type Candle = { time:number; open:number; high:number; low:number; close:number; volume:number };
const allowedSymbols=new Set(['BTCUSDT','ETHUSDT']);
const allowedIntervals=new Set(['1m','5m','15m','1h','4h','1d']);

export const onRequestGet:PagesFunction<Env>=async({request,env})=>{
  const u=new URL(request.url);
  const symbol=(u.searchParams.get('symbol')||'BTCUSDT').toUpperCase();
  const interval=u.searchParams.get('interval')||'1h';
  if(!allowedSymbols.has(symbol)||!allowedIntervals.has(interval)) return json({error:'Unsupported symbol or interval'},400);
  const base=env.BINANCE_API_BASE||'https://api.binance.com';
  try {
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),8000);
    const [tr,kr]=await Promise.all([
      fetch(`${base}/api/v3/ticker/24hr?symbol=${symbol}`,{signal:controller.signal}),
      fetch(`${base}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`,{signal:controller.signal})
    ]);
    clearTimeout(timer);
    if(!tr.ok||!kr.ok) throw new Error(`Provider response ${tr.status}/${kr.status}`);
    const t=await tr.json() as Record<string,string>;
    const raw=await kr.json() as unknown[][];
    const candles:Candle[]=raw.map(x=>({time:Math.floor(Number(x[0])/1000),open:Number(x[1]),high:Number(x[2]),low:Number(x[3]),close:Number(x[4]),volume:Number(x[5])}));
    const recent=candles.slice(-20),prior=candles.slice(-40,-20);
    const hi=Math.max(...recent.map(x=>x.high)),lo=Math.min(...recent.map(x=>x.low));
    const pHi=Math.max(...prior.map(x=>x.high)),pLo=Math.min(...prior.map(x=>x.low));
    const structure=hi>pHi&&lo>pLo?'higher range':hi<pHi&&lo<pLo?'lower range':'overlapping range';
    return json({symbol,interval,ticker:{symbol,price:Number(t.lastPrice),changePercent:Number(t.priceChangePercent),volume:Number(t.quoteVolume),high:Number(t.highPrice),low:Number(t.lowPrice),updatedAt:new Date().toISOString()},candles,indicators:calc(candles),analysis:{elliott:{status:'candidate_only',detail:`ZigZag 확정 전 ${structure} 후보. 파동 번호는 확정하지 않습니다.`},wyckoff:{status:'candidate_only',detail:`최근 가격·거래량은 ${structure} 후보로만 분류됩니다.`}},probability:null,probabilityStatus:'unavailable'},200,{'Cache-Control':'public, max-age=30, s-maxage=30'});
  } catch(e) {
    return json({error:'Market data provider unavailable',detail:e instanceof Error?e.message:'Unknown error'},502);
  }
};

function calc(c:Candle[]){const vals=c.map(x=>x.close),ema=(p:number)=>{if(vals.length<p)return null;let v=vals.slice(0,p).reduce((a,b)=>a+b,0)/p,k=2/(p+1);for(let i=p;i<vals.length;i++)v=vals[i]*k+v*(1-k);return v},rsi=()=>{let g=0,l=0;for(let i=vals.length-14;i<vals.length;i++){const d=vals[i]-vals[i-1];d>0?g+=d:l-=d}return l===0?100:100-100/(1+g/l)},fast=ema(12),slow=ema(26),middle=vals.slice(-20).reduce((a,b)=>a+b,0)/20,sd=Math.sqrt(vals.slice(-20).reduce((s,x)=>s+(x-middle)**2,0)/20),atr=c.slice(-14).reduce((s,x,i,a)=>{const p=i?a[i-1].close:c[c.length-15].close;return s+Math.max(x.high-x.low,Math.abs(x.high-p),Math.abs(x.low-p))},0)/14;return{rsi:rsi(),ema20:ema(20),ema50:ema(50),ema200:ema(200),macd:fast!==null&&slow!==null?fast-slow:null,signal:null,atr,bollinger:{upper:middle+2*sd,middle,lower:middle-2*sd}}}
function json(body:unknown,status=200,extra:Record<string,string>={}){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json;charset=UTF-8','X-Content-Type-Options':'nosniff',...extra}})}
