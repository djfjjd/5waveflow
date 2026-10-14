import {createChart,ColorType,CandlestickSeries,HistogramSeries,LineSeries,type IChartApi} from 'lightweight-charts';
import {useEffect,useRef} from 'react';
import {bollingerBands,emaSeries} from '../lib/indicators';
import type {Candle} from '../types';

export default function MarketChart({candles,ema20,ema50,ema200,bollinger,height=410}:{candles:Candle[];ema20?:boolean;ema50?:boolean;ema200?:boolean;bollinger?:boolean;height?:number}){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!ref.current||!candles.length)return;
    const chart:IChartApi=createChart(ref.current,{height,layout:{background:{type:ColorType.Solid,color:'transparent'},textColor:'#8b95a5'},grid:{vertLines:{color:'#1c2530'},horzLines:{color:'#1c2530'}},rightPriceScale:{borderColor:'#27313d'},timeScale:{borderColor:'#27313d',timeVisible:true}});
    const cs=chart.addSeries(CandlestickSeries,{upColor:'#00c896',downColor:'#ff5c70',borderVisible:false,wickUpColor:'#00c896',wickDownColor:'#ff5c70'});
    cs.setData(candles.map(x=>({time:x.time as never,open:x.open,high:x.high,low:x.low,close:x.close})));
    const vol=chart.addSeries(HistogramSeries,{priceFormat:{type:'volume'},priceScaleId:'volume'});
    chart.priceScale('volume').applyOptions({scaleMargins:{top:.82,bottom:0}});
    vol.setData(candles.map(x=>({time:x.time as never,value:x.volume,color:x.close>=x.open?'rgba(0,200,150,.28)':'rgba(255,92,112,.28)'})));
    const closes=candles.map(candle=>candle.close);
    const addEma=(period:number,color:string)=>{const values=emaSeries(closes,period);if(!values.length)return;const line=chart.addSeries(LineSeries,{color,lineWidth:1,priceLineVisible:false,lastValueVisible:false});line.setData(values.flatMap((value,index)=>Number.isFinite(value)?[{time:candles[index].time as never,value}]:[]))};
    if(ema20)addEma(20,'#4f8cff');
    if(ema50)addEma(50,'#f5b942');
    if(ema200)addEma(200,'#c084fc');
    if(bollinger){const bands=candles.flatMap((candle,index)=>{const value=bollingerBands(closes.slice(0,index+1));return value?[{time:candle.time as never,...value}]:[]});for(const [key,color] of [['upper','#64748b'],['middle','#94a3b8'],['lower','#64748b']] as const){const line=chart.addSeries(LineSeries,{color,lineWidth:1,priceLineVisible:false,lastValueVisible:false});line.setData(bands.map(point=>({time:point.time,value:point[key]})))}}
    chart.timeScale().fitContent();
    const ro=new ResizeObserver(([e])=>chart.applyOptions({width:e.contentRect.width}));
    ro.observe(ref.current);
    return()=>{ro.disconnect();chart.remove()};
  },[candles,ema20,ema50,ema200,bollinger,height]);
  return <div ref={ref} className="w-full"/>
}
