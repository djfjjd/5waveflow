type UpbitTicker={market:string;trade_price:number;signed_change_rate:number;timestamp:number};

export const onRequestGet:PagesFunction=async()=>{
  try{
    const response=await fetch('https://api.upbit.com/v1/ticker?markets=KRW-BTC',{headers:{accept:'application/json'},signal:AbortSignal.timeout(6000)});
    if(!response.ok)throw new Error(`Provider response ${response.status}`);
    const data=await response.json() as UpbitTicker[];
    const ticker=data[0];
    if(!ticker||!Number.isFinite(ticker.trade_price))throw new Error('Invalid provider response');
    return json({symbol:'BTCKRW',price:ticker.trade_price,changePercent:ticker.signed_change_rate*100,updatedAt:new Date(ticker.timestamp).toISOString()},200,{'Cache-Control':'public, max-age=5, s-maxage=5'});
  }catch(error){
    return json({error:'Upbit market data unavailable',detail:error instanceof Error?error.message:'Unknown error'},502,{'Cache-Control':'no-store'});
  }
};

function json(body:unknown,status:number,extra:Record<string,string>){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json;charset=UTF-8','X-Content-Type-Options':'nosniff',...extra}})}
