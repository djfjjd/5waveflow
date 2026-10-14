import type {Candle} from '../../types';
import {detectZigZag} from './zigzag';
import type {ElliottAnalysis,ElliottScenario,ZigZagPivot} from './types';

export function analyzeElliott(candles:Candle[]):ElliottAnalysis{
  const pivots=detectZigZag(candles);
  if(pivots.length<4)return{status:'unavailable',detail:'확정 피벗이 부족해 Elliott 후보를 판정할 수 없습니다.',pivots,scenarios:[],analyzedAt:candles.at(-1)?.time??null};
  const scenarios:ElliottScenario[]=[];
  for(let start=Math.max(0,pivots.length-8);start<=pivots.length-6;start++){const scenario=evaluateImpulse(pivots.slice(start,start+6));if(scenario)scenarios.push(scenario)}
  for(let start=Math.max(0,pivots.length-6);start<=pivots.length-4;start++){const scenario=evaluateAbc(pivots.slice(start,start+4));if(scenario)scenarios.push(scenario)}
  const unique=scenarios.sort((a,b)=>Number(b.status==='confirmed')-Number(a.status==='confirmed')).slice(0,3);
  const status=unique.some(value=>value.status==='confirmed')?'confirmed':'developing';
  return{status,detail:unique.length?`${unique[0].label} · ${unique[0].reasons.join(', ')}`:structureSummary(pivots),pivots,scenarios:unique,analyzedAt:candles.at(-1)?.time??null};
}

function structureSummary(pivots:ZigZagPivot[]){const confirmed=pivots.filter(value=>value.confirmed),highs=confirmed.filter(value=>value.type==='high').slice(-2),lows=confirmed.filter(value=>value.type==='low').slice(-2);let structure='혼조 구조';if(highs.length===2&&lows.length===2){if(highs[1].price>highs[0].price&&lows[1].price>lows[0].price)structure='고점·저점 상승 구조';else if(highs[1].price<highs[0].price&&lows[1].price<lows[0].price)structure='고점·저점 하락 구조'}return`ZigZag 확정 피벗 ${confirmed.length}개 · ${structure} · 파동 규칙 충족 대기`}

export function evaluateImpulse(p:ZigZagPivot[]):ElliottScenario|null{
  if(p.length!==6)return null;
  const bullish=p.map(x=>x.type).join(',')==='low,high,low,high,low,high';
  const bearish=p.map(x=>x.type).join(',')==='high,low,high,low,high,low';
  if(!bullish&&!bearish)return null;
  const direction=bullish?'bullish':'bearish',sign=bullish?1:-1;
  const w1=(p[1].price-p[0].price)*sign,w3=(p[3].price-p[2].price)*sign,w5=(p[5].price-p[4].price)*sign;
  const wave2Valid=(p[2].price-p[0].price)*sign>0;
  const wave3Valid=w3>Math.min(w1,w5);
  const wave4Valid=bullish?p[4].price>p[1].price:p[4].price<p[1].price;
  if(w1<=0||w3<=0||w5<=0||!wave2Valid||!wave3Valid||!wave4Valid)return null;
  const retracement=Math.abs((p[2].price-p[1].price)/(p[1].price-p[0].price));
  const extension=Math.abs((p[3].price-p[2].price)/(p[1].price-p[0].price));
  return{pattern:'impulse',direction,status:p.every(value=>value.confirmed)?'confirmed':'developing',label:`${bullish?'상승':'하락'} 1-5 충격파 후보`,waveLabels:['0','1','2','3','4','5'],pivotIndexes:p.map(value=>value.index),reasons:[`2파 되돌림 ${(retracement*100).toFixed(1)}%`,'3파 최단 규칙 충족','4파-1파 비중첩'],counterReasons:[],invalidationPrice:p[0].price,fibonacci:{retracement,extension}};
}

export function evaluateAbc(p:ZigZagPivot[]):ElliottScenario|null{
  if(p.length!==4)return null;
  const bearish=p.map(x=>x.type).join(',')==='high,low,high,low'&&p[2].price<p[0].price&&p[3].price<p[1].price;
  const bullish=p.map(x=>x.type).join(',')==='low,high,low,high'&&p[2].price>p[0].price&&p[3].price>p[1].price;
  if(!bearish&&!bullish)return null;
  const retracement=Math.abs((p[2].price-p[1].price)/(p[1].price-p[0].price));
  const extension=Math.abs((p[3].price-p[2].price)/(p[1].price-p[0].price));
  return{pattern:'abc',direction:bullish?'bullish':'bearish',status:p.every(value=>value.confirmed)?'confirmed':'developing',label:`${bullish?'상승':'하락'} A-B-C 조정 후보`,waveLabels:['시작','A','B','C'],pivotIndexes:p.map(value=>value.index),reasons:[`B파 되돌림 ${(retracement*100).toFixed(1)}%`,'C파가 A파 극점 돌파'],counterReasons:[],invalidationPrice:p[0].price,fibonacci:{retracement,extension}};
}
