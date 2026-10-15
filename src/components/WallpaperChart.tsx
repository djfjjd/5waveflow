import {CandlestickSeries,ColorType,HistogramSeries,createChart,createSeriesMarkers,type SeriesMarker,type UTCTimestamp} from 'lightweight-charts';
import {useEffect,useRef} from 'react';
import type {MarketPayload} from '../types';
import type {WallpaperTheme} from '@5waveflow/wallpaper';

type Props={market:MarketPayload|undefined;theme:WallpaperTheme;showPriceScale:boolean;showVolume:boolean;showLogo:boolean;showAnalysis:boolean};

export default function WallpaperChart({market,theme,showPriceScale,showVolume,showLogo,showAnalysis}:Props){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const root=ref.current;if(!root||!market?.candles.length)return;
    const dark=theme==='dark',chart=createChart(root,{width:root.clientWidth,height:root.clientHeight,layout:{background:{type:ColorType.Solid,color:dark?'#0b1017':'#f4f7fb'},textColor:dark?'#8b95a5':'#526071',attributionLogo:true},grid:{vertLines:{color:dark?'#17202b':'#e3e8ef'},horzLines:{color:dark?'#17202b':'#e3e8ef'}},rightPriceScale:{visible:showPriceScale,borderColor:dark?'#27313d':'#d5dce5'},timeScale:{borderColor:dark?'#27313d':'#d5dce5',timeVisible:true},handleScroll:false,handleScale:false});
    const candles=market.candles,series=chart.addSeries(CandlestickSeries,{upColor:'#00c896',downColor:'#ff5c70',borderVisible:false,wickUpColor:'#00c896',wickDownColor:'#ff5c70'});
    series.setData(candles.map(c=>({time:c.time as UTCTimestamp,open:c.open,high:c.high,low:c.low,close:c.close})));
    if(showVolume){const volume=chart.addSeries(HistogramSeries,{priceFormat:{type:'volume'},priceScaleId:'volume'});chart.priceScale('volume').applyOptions({scaleMargins:{top:.82,bottom:0}});volume.setData(candles.map(c=>({time:c.time as UTCTimestamp,value:c.volume,color:c.close>=c.open?'rgba(0,200,150,.28)':'rgba(255,92,112,.28)'})))}
    if(showAnalysis){const markers:SeriesMarker<UTCTimestamp>[]=[];const scenario=market.analysis.elliott.scenarios[0];scenario?.pivotIndexes.forEach((index,labelIndex)=>{const candle=candles[index],pivot=market.analysis.elliott.pivots.find(item=>item.index===index);if(candle&&pivot)markers.push({time:candle.time as UTCTimestamp,position:'atPriceMiddle',price:pivot.price,shape:'circle',color:'#4f8cff',text:scenario.waveLabels[labelIndex],size:1})});market.analysis.wyckoff.events.forEach(event=>{const candle=candles[event.index];if(candle)markers.push({time:candle.time as UTCTimestamp,position:'atPriceMiddle',price:event.price,shape:'square',color:'#f5b942',text:event.type,size:.8})});markers.sort((a,b)=>(a.time as number)-(b.time as number));createSeriesMarkers(series,markers,{zOrder:'top'})}
    chart.timeScale().setVisibleLogicalRange({from:Math.max(0,candles.length-90),to:candles.length+4});
    const observer=new ResizeObserver(()=>chart.applyOptions({width:root.clientWidth,height:root.clientHeight}));observer.observe(root);return()=>{observer.disconnect();chart.remove()};
  },[market,showAnalysis,showPriceScale,showVolume,theme]);
  return <div className={`relative h-full w-full overflow-hidden ${theme==='dark'?'bg-[#0b1017]':'bg-[#f4f7fb]'}`}><div ref={ref} className="absolute inset-0"/>{showLogo&&<div className={`pointer-events-none absolute left-5 top-5 text-sm font-bold ${theme==='dark'?'text-white':'text-[#111827]'}`}>5Wave<span className="text-primary">Flow</span> Live</div>}</div>;
}
