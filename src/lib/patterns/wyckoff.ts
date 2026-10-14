import type {Candle} from '../../types';
import {atrSeries} from './zigzag';
import type {WyckoffAnalysis,WyckoffEvent,WyckoffEventType} from './types';

export function analyzeWyckoff(candles:Candle[]):WyckoffAnalysis{
  if(candles.length<50)return empty(candles,'가격·거래량 분석에 필요한 캔들이 부족합니다.');
  const atr=atrSeries(candles),events:WyckoffEvent[]=[];
  for(let index=20;index<candles.length;index++){
    const prior=candles.slice(index-20,index),current=candles[index];
    const support=Math.min(...prior.map(value=>value.low)),resistance=Math.max(...prior.map(value=>value.high));
    const volumeAverage=prior.reduce((sum,value)=>sum+value.volume,0)/prior.length;
    const spread=current.high-current.low,spreadRatio=atr[index]?spread/atr[index]!:0,volumeRatio=volumeAverage?current.volume/volumeAverage:0;
    const closePosition=spread?((current.close-current.low)/spread):.5;
    const add=(type:WyckoffEventType,reasons:string[])=>events.push({type,index,time:current.time,price:current.close,confirmed:index<candles.length-1,reasons});
    if(current.low<support&&current.close>support&&volumeRatio>=1.2)add('Spring',[`지지 ${support.toFixed(2)} 하향 이탈 후 재진입`,`거래량 ${volumeRatio.toFixed(2)}배`]);
    if(current.high>resistance&&current.close<resistance&&volumeRatio>=1.2)add('Upthrust',[`저항 ${resistance.toFixed(2)} 상향 이탈 후 재진입`,`거래량 ${volumeRatio.toFixed(2)}배`]);
    if(current.close>resistance&&closePosition>.65&&volumeRatio>=1.15)add('SOS',[`저항 ${resistance.toFixed(2)} 돌파`,'강한 종가 위치']);
    if(current.close<support&&closePosition<.35&&volumeRatio>=1.15)add('SOW',[`지지 ${support.toFixed(2)} 이탈`,'약한 종가 위치']);
    if(volumeRatio>=2&&spreadRatio>=1.5&&closePosition>.65)add('BC',[`거래량 급증 ${volumeRatio.toFixed(2)}배`,'상단 종가 대형 스프레드']);
    if(volumeRatio>=2&&spreadRatio>=1.5&&closePosition<.35)add('SC',[`거래량 급증 ${volumeRatio.toFixed(2)}배`,'하단 종가 대형 스프레드']);
  }
  const recent=candles.slice(-40),support=Math.min(...recent.map(value=>value.low)),resistance=Math.max(...recent.map(value=>value.high));
  const latest=events.slice(-8),types=new Set(latest.map(event=>event.type));
  let phase:WyckoffAnalysis['phase']=null,bias:WyckoffAnalysis['bias']='uncertain';
  const reasons:string[]=[],counterReasons:string[]=[];
  if(types.has('Spring')){phase='C';bias='accumulation';reasons.push('Spring 재진입 감지')}
  if(types.has('Upthrust')){phase='C';bias='distribution';reasons.push('Upthrust 재진입 감지')}
  if(types.has('SOS')){phase=types.has('Spring')?'D':'E';bias='accumulation';reasons.push('저항 돌파와 거래량 확인')}
  if(types.has('SOW')){phase=types.has('Upthrust')?'D':'E';bias='distribution';reasons.push('지지 이탈과 거래량 확인')}
  if(!phase&&(types.has('SC')||types.has('BC'))){phase='A';bias=types.has('SC')?'accumulation':'distribution';reasons.push('Climax성 거래량·스프레드 감지')}
  if(!phase){counterReasons.push('Phase 판정에 필요한 Spring, Upthrust 또는 돌파 이벤트 부족');return{status:'unavailable',detail:'Wyckoff Phase를 판정할 충분한 이벤트가 없습니다.',phase:null,bias,support,resistance,events:latest,reasons,counterReasons,analyzedAt:candles.at(-1)?.time??null}}
  const status=latest.some(event=>!event.confirmed)?'developing':'confirmed';
  return{status,detail:`Phase ${phase} ${bias==='accumulation'?'매집':bias==='distribution'?'분산':'불확실'} 후보 · ${reasons.join(', ')}`,phase,bias,support,resistance,events:latest,reasons,counterReasons,analyzedAt:candles.at(-1)?.time??null};
}

function empty(candles:Candle[],detail:string):WyckoffAnalysis{return{status:'unavailable',detail,phase:null,bias:'uncertain',support:null,resistance:null,events:[],reasons:[],counterReasons:[detail],analyzedAt:candles.at(-1)?.time??null}}
