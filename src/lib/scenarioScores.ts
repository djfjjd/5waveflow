import type {IndicatorSnapshot,MarketPayload} from '../types';

export type ScenarioScores={bullish:number;sideways:number;bearish:number};

export function scenarioScores(market:MarketPayload|undefined):ScenarioScores{
  if(!market)return{bullish:0,sideways:0,bearish:0};
  return scenarioScoresFromIndicators(market.indicators);
}

export function scenarioScoresFromIndicators(i:IndicatorSnapshot):ScenarioScores{
  let bullish=20,bearish=20,sideways=20;
  if(i.rsi!=null){if(i.rsi>55)bullish+=20;else if(i.rsi<45)bearish+=20;else sideways+=20}
  if(i.macd!=null&&i.signal!=null){if(i.macd>i.signal)bullish+=20;else bearish+=20}
  if(i.ema20!=null&&i.ema50!=null&&i.ema200!=null){if(i.ema20>i.ema50&&i.ema50>i.ema200)bullish+=25;else if(i.ema20<i.ema50&&i.ema50<i.ema200)bearish+=25;else sideways+=25}
  if(Math.abs(i.volumeChangePercent??0)<10)sideways+=15;
  const total=bullish+bearish+sideways,up=Math.round(bullish/total*100),flat=Math.round(sideways/total*100);
  return{bullish:up,sideways:flat,bearish:100-up-flat};
}
