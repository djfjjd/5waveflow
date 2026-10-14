export function emaSeries(values:number[],period:number){
  if(period<=0||values.length<period)return [];
  let value=values.slice(0,period).reduce((sum,current)=>sum+current,0)/period;
  const output=Array<number>(period-1).fill(Number.NaN).concat(value);
  const multiplier=2/(period+1);
  for(let index=period;index<values.length;index++){
    value=values[index]*multiplier+value*(1-multiplier);
    output.push(value);
  }
  return output;
}

export function ema(values:number[],period:number){
  const series=emaSeries(values,period);
  return series.length?series.at(-1)!:null;
}
