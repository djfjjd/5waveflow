import type {Candle} from '../../types';
import {trueRange} from '../indicators/atr';
import type {PivotType,ZigZagPivot} from './types';

export type ZigZagOptions={atrPeriod?:number;atrMultiplier?:number;depth?:number};

export function atrSeries(candles:Candle[],period=14){
  const output=Array<number|null>(candles.length).fill(null);
  if(candles.length<=period)return output;
  const ranges=candles.slice(1).map((candle,index)=>trueRange(candle,candles[index].close));
  let value=ranges.slice(0,period).reduce((sum,current)=>sum+current,0)/period;
  output[period]=value;
  for(let index=period;index<ranges.length;index++){value=(value*(period-1)+ranges[index])/period;output[index+1]=value}
  return output;
}

export function detectZigZag(candles:Candle[],options:ZigZagOptions={}):ZigZagPivot[]{
  const{atrPeriod=14,atrMultiplier=1.5,depth=3}=options;
  if(candles.length<atrPeriod+depth*2+1)return[];
  const atrValues=atrSeries(candles,atrPeriod);
  const candidates:ZigZagPivot[]=[];
  for(let index=depth;index<candles.length-depth;index++){
    const window=candles.slice(index-depth,index+depth+1),candle=candles[index];
    if(candle.high===Math.max(...window.map(value=>value.high)))candidates.push(pivot(index,'high',candle.high,true));
    if(candle.low===Math.min(...window.map(value=>value.low)))candidates.push(pivot(index,'low',candle.low,true));
  }
  candidates.sort((a,b)=>a.index-b.index||Number(a.type==='low')-Number(b.type==='low'));
  const result:ZigZagPivot[]=[];
  for(const candidate of candidates){
    candidate.atr=atrValues[candidate.index];
    const previous=result.at(-1);
    if(!previous){result.push(candidate);continue}
    if(candidate.type===previous.type){if(isMoreExtreme(candidate,previous))result[result.length-1]=candidate;continue}
    const threshold=(candidate.atr??previous.atr??0)*atrMultiplier;
    if(Math.abs(candidate.price-previous.price)>=threshold)result.push(candidate);
  }
  const last=result.at(-1);
  if(last&&last.index<candles.length-1){
    const type:PivotType=last.type==='high'?'low':'high';
    let index=last.index+1;
    for(let current=index+1;current<candles.length;current++)if(type==='high'?candles[current].high>candles[index].high:candles[current].low<candles[index].low)index=current;
    const price=type==='high'?candles[index].high:candles[index].low;
    const threshold=(atrValues[index]??last.atr??0)*atrMultiplier;
    if(Math.abs(price-last.price)>=threshold){const ongoing=pivot(index,type,price,false);ongoing.atr=atrValues[index];result.push(ongoing)}
  }
  return result;

  function pivot(index:number,type:PivotType,price:number,confirmed:boolean):ZigZagPivot{return{index,time:candles[index].time,price,type,confirmed,atr:null}}
}

function isMoreExtreme(next:ZigZagPivot,previous:ZigZagPivot){return next.type==='high'?next.price>previous.price:next.price<previous.price}
