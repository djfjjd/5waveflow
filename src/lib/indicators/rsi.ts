export function rsi(values:number[],period=14){
  if(period<=0||values.length<=period)return null;
  let gains=0;
  let losses=0;
  for(let index=1;index<=period;index++){
    const change=values[index]-values[index-1];
    if(change>0)gains+=change;else losses-=change;
  }
  let averageGain=gains/period;
  let averageLoss=losses/period;
  for(let index=period+1;index<values.length;index++){
    const change=values[index]-values[index-1];
    averageGain=(averageGain*(period-1)+Math.max(change,0))/period;
    averageLoss=(averageLoss*(period-1)+Math.max(-change,0))/period;
  }
  if(averageLoss===0)return averageGain===0?50:100;
  return 100-100/(1+averageGain/averageLoss);
}
