export type BollingerBands={upper:number;middle:number;lower:number};

export function sma(values:number[],period:number){
  if(period<=0||values.length<period)return null;
  return values.slice(-period).reduce((sum,current)=>sum+current,0)/period;
}

export function bollingerBands(values:number[],period=20,deviations=2):BollingerBands|null{
  const middle=sma(values,period);
  if(middle===null)return null;
  const sample=values.slice(-period);
  const standardDeviation=Math.sqrt(sample.reduce((sum,value)=>sum+(value-middle)**2,0)/period);
  return{upper:middle+deviations*standardDeviation,middle,lower:middle-deviations*standardDeviation};
}
