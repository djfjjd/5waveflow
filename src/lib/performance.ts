import {indicators} from './indicators';
import {scenarioScoresFromIndicators,type ScenarioScores} from './scenarioScores';
import type {Candle} from '../types';

export const PERFORMANCE_INTERVALS=['15m','1h','4h','1d'] as const;
export type PerformanceInterval=typeof PERFORMANCE_INTERVALS[number];
export type Direction='bullish'|'sideways'|'bearish';
export type RecordKind='backtest'|'live';
export const PERFORMANCE_MODEL_VERSION='quant-direction-v1';

export type PerformanceResult={
  id:string;symbol:string;interval:PerformanceInterval;recordKind:RecordKind;predictionTime:string;targetTime:string;
  predictionPrice:number;observedPrice:number;scores:ScenarioScores;predictedDirection:Direction;actualDirection:Direction;
  returnPercent:number;sidewaysThresholdPercent:number;hit:boolean;modelVersion:string;
};
export type DirectionMetric={completed:number;hits:number;winRate:number|null};
export type PerformanceSummary={targetCount:number;completed:number;hits:number;misses:number;winRate:number|null;brierScore:number|null;byDirection:Record<Direction,DirectionMetric>};
export type PerformancePayload={symbol:string;interval:PerformanceInterval;provider:string;recordKind:'backtest';modelAvailable:boolean;modelVersion:string;generatedAt:string;summary:PerformanceSummary;results:PerformanceResult[];emptyReason:string};

export function intervalSeconds(interval:PerformanceInterval){return{'15m':900,'1h':3600,'4h':14400,'1d':86400}[interval]}
export function closedCandles(candles:Candle[],interval:PerformanceInterval,nowMs=Date.now()){const duration=intervalSeconds(interval);return candles.filter(candle=>(candle.time+duration)*1000<=nowMs)}
export function selectValidationTargets(candles:Candle[],count=30){return candles.map((_,index)=>index).slice(-count)}
export function predictedDirection(scores:ScenarioScores):Direction{const values:Record<Direction,number>={bullish:scores.bullish,sideways:scores.sideways,bearish:scores.bearish};return(['sideways','bullish','bearish'] as Direction[]).reduce((best,value)=>values[value]>values[best]?value:best)}
export function actualDirection(returnPercent:number,thresholdPercent:number):Direction{return returnPercent>thresholdPercent?'bullish':returnPercent<-thresholdPercent?'bearish':'sideways'}

export function buildBacktest(symbol:string,interval:PerformanceInterval,input:Candle[],count=30):PerformanceResult[]{
  const candles=[...input].sort((a,b)=>a.time-b.time),targets=selectValidationTargets(candles,count),results:PerformanceResult[]=[];
  for(const targetIndex of targets){
    const history=candles.slice(0,targetIndex),target=candles[targetIndex];
    if(history.length<200||!target)continue;
    const snapshot=indicators(history);
    if(snapshot.ema200==null||snapshot.atr==null)continue;
    const predictionPrice=history.at(-1)!.close,scores=scenarioScoresFromIndicators(snapshot),prediction=predictedDirection(scores);
    const returnPercent=(target.close-predictionPrice)/predictionPrice*100;
    const sidewaysThresholdPercent=Math.max(.1,snapshot.atr/predictionPrice*100*.15),actual=actualDirection(returnPercent,sidewaysThresholdPercent);
    const boundary=target.time,targetClose=target.time+intervalSeconds(interval);
    results.push({id:`${symbol}:${interval}:${target.time}:${PERFORMANCE_MODEL_VERSION}`,symbol,interval,recordKind:'backtest',predictionTime:new Date(boundary*1000).toISOString(),targetTime:new Date(targetClose*1000).toISOString(),predictionPrice,observedPrice:target.close,scores,predictedDirection:prediction,actualDirection:actual,returnPercent,sidewaysThresholdPercent,hit:prediction===actual,modelVersion:PERFORMANCE_MODEL_VERSION});
  }
  return results;
}

export function summarizePerformance(results:PerformanceResult[],targetCount=30):PerformanceSummary{
  const completed=results.length,hits=results.filter(value=>value.hit).length;
  const metric=(direction:Direction):DirectionMetric=>{const selected=results.filter(value=>value.predictedDirection===direction),directionHits=selected.filter(value=>value.hit).length;return{completed:selected.length,hits:directionHits,winRate:selected.length?directionHits/selected.length*100:null}};
  const brierScore=completed?results.reduce((sum,value)=>{const actual:{[K in Direction]:number}={bullish:0,sideways:0,bearish:0};actual[value.actualDirection]=1;return sum+((value.scores.bullish/100-actual.bullish)**2+(value.scores.sideways/100-actual.sideways)**2+(value.scores.bearish/100-actual.bearish)**2)},0)/completed:null;
  return{targetCount,completed,hits,misses:completed-hits,winRate:completed?hits/completed*100:null,brierScore,byDirection:{bullish:metric('bullish'),sideways:metric('sideways'),bearish:metric('bearish')}};
}
