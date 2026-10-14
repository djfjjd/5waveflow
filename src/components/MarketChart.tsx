import {createChart,ColorType,CandlestickSeries,HistogramSeries,LineSeries,type IChartApi} from 'lightweight-charts';
import {useEffect,useRef} from 'react';
import type {Candle} from '../types';

export default function MarketChart({candles,ema20,ema50,height=410}:{candles:Candle[];ema20?:boolean;ema50?:boolean;height?:number}){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!ref.current||!candles.length)return;
    const chart:IChartApi=createChart(ref.current,{height,layout:{background:{type:ColorType.Solid,color:'transparent'},textColor:'#8b95a5'},grid:{vertLines:{color:'#1c2530'},horzLines:{color:'#1c2530'}},rightPriceScale:{borderColor:'#27313d'},timeScale:{borderColor:'#27313d',timeVisible:true}});
    const cs=chart.addSeries(CandlestickSeries,{upColor:'#00c896',downColor:'#ff5c70',borderVisible:false,wickUpColor:'#00c896',wickDownColor:'#ff5c70'});
    cs.setData(candles.map(x=>({time:x.time as never,open:x.open,high:x.high,low:x.low,close:x.close})));
    const vol=chart.addSeries(HistogramSeries,{priceFormat:{type:'volume'},priceScaleId:'volume'});
    chart.priceScale('volume').applyOptions({scaleMargins:{top:.82,bottom:0}});
    vol.setData(candles.map(x=>({time:x.time as never,value:x.volume,color:x.close>=x.open?'rgba(0,200,150,.28)':'rgba(255,92,112,.28)'})));
    const addEma=(period:number,color:string)=>{if(candles.length<period)return;let v=candles.slice(0,period).reduce((s,x)=>s+x.close,0)/period;const points=[{time:candles[period-1].time as never,value:v}],k=2/(period+1);for(let i=period;i<candles.length;i++){v=candles[i].close*k+v*(1-k);points.push({time:candles[i].time as never,value:v})}const line=chart.addSeries(LineSeries,{color,lineWidth:1,priceLineVisible:false,lastValueVisible:false});line.setData(points)};
    if(ema20)addEma(20,'#4f8cff');
    if(ema50)addEma(50,'#f5b942');
    chart.timeScale().fitContent();
    const ro=new ResizeObserver(([e])=>chart.applyOptions({width:e.contentRect.width}));
    ro.observe(ref.current);
    return()=>{ro.disconnect();chart.remove()};
  },[candles,ema20,ema50,height]);
  return <div ref={ref} className="w-full"/>
}
