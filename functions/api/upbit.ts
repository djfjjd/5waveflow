type UpbitTicker={market:string;trade_price:number;signed_change_rate:number;timestamp:number};

export const onRequestGet:PagesFunction=async()=>{
  try{
    const response=await fetch('https://api.upbit.com/v1/ticker?markets=KRW-BTC',{headers:{accept:'application/json'},signal:AbortSignal.timeout(6000)});
    if(!response.ok)throw new Error(`Provider response ${response.status}`);
    const data=await response.json() as UpbitTicker[];
    const ticker=data[0];
    if(!ticker||!Number.isFinite(ticker.trade_price))throw new Error('Invalid provider response');
    const[usdtResult,fxResult]=await Promise.allSettled([getBtcUsdt(),getUsdKrw()]);
    const btcUsdt=usdtResult.status==='fulfilled'?usdtResult.value:null;
    const usdKrw=fxResult.status==='fulfilled'?fxResult.value:null;
    const kimchiPremium=btcUsdt&&usdKrw?(ticker.trade_price/(btcUsdt*usdKrw)-1)*100:null;
    return json({symbol:'BTCKRW',price:ticker.trade_price,changePercent:ticker.signed_change_rate*100,btcUsdt,usdKrw,kimchiPremium,updatedAt:new Date(ticker.timestamp).toISOString()},200,{'Cache-Control':'public, max-age=5, s-maxage=5'});
  }catch(error){
    return json({error:'Upbit market data unavailable',detail:error instanceof Error?error.message:'Unknown error'},502,{'Cache-Control':'no-store'});
  }
};

async function getBtcUsdt(){
  const requests=['https://data-api.binance.vision','https://api.binance.com','https://api1.binance.com'].map(async base=>{const response=await fetch(`${base}/api/v3/ticker/price?symbol=BTCUSDT`,{signal:AbortSignal.timeout(5000)});if(!response.ok)throw new Error(`Binance ${response.status}`);const data=await response.json() as {price:string};const price=Number(data.price);if(!Number.isFinite(price))throw new Error('Invalid Binance price');return price});
  requests.push((async()=>{const response=await fetch('https://api.kraken.com/0/public/Ticker?pair=XBTUSDT',{signal:AbortSignal.timeout(5000)});if(!response.ok)throw new Error(`Kraken ${response.status}`);const data=await response.json() as {error:string[];result:Record<string,{c:string[]}>};const price=Number(Object.values(data.result)[0]?.c[0]);if(data.error.length||!Number.isFinite(price))throw new Error('Invalid Kraken price');return price})());
  return Promise.any(requests);
}

async function getUsdKrw(){
  const response=await fetch('https://query1.finance.yahoo.com/v8/finance/chart/KRW=X?interval=1m&range=1d',{headers:{accept:'application/json','user-agent':'Mozilla/5.0 5WaveFlow/1.0'},signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw new Error(`FX response ${response.status}`);
  const data=await response.json() as {chart:{result:Array<{meta:{regularMarketPrice?:number}}> | null}};
  const rate=data.chart.result?.[0]?.meta.regularMarketPrice;
  if(!rate||!Number.isFinite(rate))throw new Error('Invalid USD/KRW rate');
  return rate;
}

function json(body:unknown,status:number,extra:Record<string,string>){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json;charset=UTF-8','X-Content-Type-Options':'nosniff',...extra}})}
