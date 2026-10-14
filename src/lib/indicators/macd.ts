import {emaSeries} from './ema';

export type MacdResult={line:number;signal:number;histogram:number};

export function macd(values:number[],fastPeriod=12,slowPeriod=26,signalPeriod=9):MacdResult|null{
  if(values.length<slowPeriod+signalPeriod-1)return null;
  const fast=emaSeries(values,fastPeriod);
  const slow=emaSeries(values,slowPeriod);
  const lineSeries:number[]=[];
  for(let index=slowPeriod-1;index<values.length;index++)lineSeries.push(fast[index]-slow[index]);
  const signalSeries=emaSeries(lineSeries,signalPeriod);
  const line=lineSeries.at(-1)!;
  const signal=signalSeries.at(-1)!;
  return{line,signal,histogram:line-signal};
}
