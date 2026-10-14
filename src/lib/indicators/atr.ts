import type {Candle} from '../../types';

export function trueRange(current:Candle,previousClose:number){
  return Math.max(current.high-current.low,Math.abs(current.high-previousClose),Math.abs(current.low-previousClose));
}

export function atr(candles:Candle[],period=14){
  if(period<=0||candles.length<=period)return null;
  const ranges=candles.slice(1).map((candle,index)=>trueRange(candle,candles[index].close));
  let value=ranges.slice(0,period).reduce((sum,current)=>sum+current,0)/period;
  for(let index=period;index<ranges.length;index++)value=(value*(period-1)+ranges[index])/period;
  return value;
}
