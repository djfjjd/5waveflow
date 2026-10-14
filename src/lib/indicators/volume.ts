export type VolumeAnalysis={movingAverage:number;changePercent:number};

export function volumeMovingAverage(volumes:number[],period=20):VolumeAnalysis|null{
  if(period<=0||volumes.length<period+1)return null;
  const current=volumes.at(-1)!;
  const movingAverage=volumes.slice(-period-1,-1).reduce((sum,value)=>sum+value,0)/period;
  return{movingAverage,changePercent:movingAverage===0?0:(current-movingAverage)/movingAverage*100};
}
