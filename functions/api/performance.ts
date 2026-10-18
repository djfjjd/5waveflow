import {indicators} from '../../src/lib/indicators';
import {scenarioScoresFromIndicators} from '../../src/lib/scenarioScores';
import {actualDirection,buildBacktest,closedCandles,intervalSeconds,PERFORMANCE_INTERVALS,PERFORMANCE_MODEL_VERSION,predictedDirection,summarizePerformance,type PerformanceInterval,type PerformanceResult} from '../../src/lib/performance';
import type {Candle} from '../../src/types';

interface Env { DB?:D1Database; CRON_SECRET?:string }
type MarketPayload={provider:string;candles:Candle[];error?:string;detail?:string};
const supportedSymbols=new Set(['KRX:005930','KRX:035720','KRX:000660','BTCUSDT','BTCKRW','ETHUSDT','XRPUSDT','NASDAQ:NVDA','NASDAQ:TSLA']);

export const onRequest:PagesFunction<Env>=async context=>{
  if(context.request.method==='GET')return handle(context,false);
  if(context.request.method==='POST'){
    if(!context.env.CRON_SECRET||context.request.headers.get('authorization')!==`Bearer ${context.env.CRON_SECRET}`)return json({error:'Unauthorized'},401);
    return handle(context,true);
  }
  return json({error:'Method not allowed'},405);
};

async function handle({request,env}:EventContext<Env,never,unknown>,persist:boolean){
  const url=new URL(request.url),symbol=(url.searchParams.get('symbol')||'BTCUSDT').toUpperCase(),interval=url.searchParams.get('interval')||'15m';
  if(!supportedSymbols.has(symbol)||!PERFORMANCE_INTERVALS.includes(interval as PerformanceInterval))return json({error:'Unsupported symbol or interval'},400);
  try{
    const marketUrl=new URL('/api/market',url),crypto=!symbol.includes(':');marketUrl.searchParams.set('symbol',symbol==='BTCKRW'?'BTCUSDT':symbol);marketUrl.searchParams.set('interval',interval);if(symbol==='BTCKRW')marketUrl.searchParams.set('market','upbit');else if(crypto)marketUrl.searchParams.set('market','usdt');
    const response=await fetch(marketUrl.toString(),{headers:{accept:'application/json'}}),market=await response.json() as MarketPayload;
    if(!response.ok)throw new Error(market.detail||market.error||`Market API ${response.status}`);
    const candles=closedCandles(market.candles,interval as PerformanceInterval),results=buildBacktest(symbol,interval as PerformanceInterval,candles,30);
    const exchange=market.provider==='Upbit KRW'?'upbit':market.provider==='Kraken Spot'?'kraken':'binance';
    if(persist){if(!env.DB)throw new Error('D1 binding is not configured');await persistResults(env.DB,results,exchange);await resolveAndCreateLivePrediction(env.DB,symbol,interval as PerformanceInterval,candles,exchange)}
    return json({symbol,interval,provider:market.provider,recordKind:'backtest',modelAvailable:results.length>0,modelVersion:'quant-direction-v1',generatedAt:new Date().toISOString(),summary:summarizePerformance(results),results,emptyReason:results.length?'':candles.length<201?'지표 계산에 필요한 완성 캔들이 부족합니다.':'백테스트 가능한 모델 결과가 없습니다.'},200,{'cache-control':'public, max-age=60, s-maxage=300'});
  }catch(error){return json({error:'Performance data unavailable',detail:error instanceof Error?error.message:'Unknown error'},502)}
}

async function persistResults(db:D1Database,results:PerformanceResult[],exchange:string){
  if(!results.length)return;
  const statements=results.map(value=>db.prepare(`INSERT OR IGNORE INTO performance_predictions (id,symbol,exchange,timeframe,record_kind,prediction_time,target_time,prediction_price,bullish_probability,sideways_probability,bearish_probability,predicted_direction,actual_direction,observed_price,return_percent,sideways_threshold_percent,hit,model_version,resolved_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(value.id,value.symbol,exchange,value.interval,value.recordKind,value.predictionTime,value.targetTime,value.predictionPrice,value.scores.bullish/100,value.scores.sideways/100,value.scores.bearish/100,value.predictedDirection,value.actualDirection,value.observedPrice,value.returnPercent,value.sidewaysThresholdPercent,value.hit?1:0,value.modelVersion,new Date().toISOString()));
  await db.batch(statements);
}
type PendingRow={id:string;target_time:string;prediction_price:number;sideways_threshold_percent:number;predicted_direction:string};
async function resolveAndCreateLivePrediction(db:D1Database,symbol:string,interval:PerformanceInterval,candles:Candle[],exchange:string){
  if(candles.length<200)return;
  const duration=intervalSeconds(interval),latest=candles.at(-1)!;
  const pending=await db.prepare(`SELECT id,target_time,prediction_price,sideways_threshold_percent,predicted_direction FROM performance_predictions WHERE symbol=? AND timeframe=? AND record_kind='live' AND actual_direction IS NULL ORDER BY target_time`).bind(symbol,interval).all<PendingRow>();
  for(const row of pending.results){
    const targetClose=Math.floor(Date.parse(row.target_time)/1000),target=candles.find(candle=>candle.time+duration===targetClose);
    if(!target)continue;
    const returnPercent=(target.close-row.prediction_price)/row.prediction_price*100,actual=actualDirection(returnPercent,row.sideways_threshold_percent),hit=actual===row.predicted_direction;
    await db.prepare(`UPDATE performance_predictions SET actual_direction=?,observed_price=?,return_percent=?,hit=?,resolved_at=? WHERE id=? AND actual_direction IS NULL`).bind(actual,target.close,returnPercent,hit?1:0,new Date().toISOString(),row.id).run();
  }
  const snapshot=indicators(candles),scores=scenarioScoresFromIndicators(snapshot);
  if(snapshot.atr==null||snapshot.ema200==null)return;
  const predictionPrice=latest.close,predictionTime=latest.time+duration,targetTime=predictionTime+duration,threshold=Math.max(.1,snapshot.atr/predictionPrice*100*.15),id=`${symbol}:${interval}:live:${predictionTime}:${PERFORMANCE_MODEL_VERSION}`;
  await db.prepare(`INSERT OR IGNORE INTO performance_predictions (id,symbol,exchange,timeframe,record_kind,prediction_time,target_time,prediction_price,bullish_probability,sideways_probability,bearish_probability,predicted_direction,sideways_threshold_percent,model_version) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id,symbol,exchange,interval,'live',new Date(predictionTime*1000).toISOString(),new Date(targetTime*1000).toISOString(),predictionPrice,scores.bullish/100,scores.sideways/100,scores.bearish/100,predictedDirection(scores),threshold,PERFORMANCE_MODEL_VERSION).run();
}
function json(body:unknown,status=200,headers:Record<string,string>={}){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json;charset=UTF-8','x-content-type-options':'nosniff',...headers}})}
