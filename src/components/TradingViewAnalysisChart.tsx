import {CandlestickSeries,ColorType,LineSeries,LineStyle,createChart,createSeriesMarkers,type SeriesMarker,type UTCTimestamp} from 'lightweight-charts';
import {useEffect,useRef} from 'react';
import {rsi} from '../lib/indicators';
import type {MarketPayload} from '../types';

type Props={symbol:string;interval:string;market?:MarketPayload};

export default function TradingViewAnalysisChart({symbol,interval,market}:Props){
  const container=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const root=container.current;
    if(!root||!market?.candles.length)return;
    const getHeight=()=>Math.round(root.clientWidth*(window.matchMedia('(max-width: 767px)').matches?1:9/16));
    const chart=createChart(root,{width:root.clientWidth,height:getHeight(),layout:{background:{type:ColorType.Solid,color:'#151b23'},textColor:'#8b95a5',attributionLogo:true},grid:{vertLines:{color:'transparent'},horzLines:{color:'transparent'}},rightPriceScale:{borderColor:'#27313d'},timeScale:{borderColor:'#27313d',timeVisible:true,secondsVisible:false},handleScroll:{mouseWheel:true,pressedMouseMove:true,horzTouchDrag:true,vertTouchDrag:true},handleScale:{axisPressedMouseMove:true,mouseWheel:true,pinch:true},crosshair:{vertLine:{color:'#4f8cff'},horzLine:{color:'#4f8cff'}}});
    const candles=market.candles;
    const series=chart.addSeries(CandlestickSeries,{upColor:'#00c896',downColor:'#ff5c70',borderVisible:false,wickUpColor:'#00c896',wickDownColor:'#ff5c70'});
    series.setData(candles.map(candle=>({time:candle.time as UTCTimestamp,open:candle.open,high:candle.high,low:candle.low,close:candle.close})));

    const closes=candles.map(candle=>candle.close);
    const rsiSeries=chart.addSeries(LineSeries,{color:'#9b87f5',lineWidth:2,priceLineVisible:false,lastValueVisible:true,priceFormat:{type:'price',precision:1,minMove:.1}},1);
    rsiSeries.setData(candles.flatMap((candle,index)=>{const value=rsi(closes.slice(0,index+1));return value==null?[]:[{time:candle.time as UTCTimestamp,value}]}));
    rsiSeries.createPriceLine({price:70,color:'rgba(255,92,112,.45)',lineWidth:1,lineStyle:LineStyle.Dashed,axisLabelVisible:false,title:'RSI 70'});
    rsiSeries.createPriceLine({price:30,color:'rgba(0,200,150,.45)',lineWidth:1,lineStyle:LineStyle.Dashed,axisLabelVisible:false,title:'RSI 30'});
    const resizeChart=()=>{
      const height=getHeight();
      chart.applyOptions({width:root.clientWidth,height});
      chart.panes()[1]?.setHeight(Math.max(64,Math.round(height*.18)));
    };
    resizeChart();

    const scenario=market.analysis.elliott.scenarios[0];
    const markers:SeriesMarker<UTCTimestamp>[]=[];
    if(scenario)scenario.pivotIndexes.forEach((index,labelIndex)=>{const pivot=market.analysis.elliott.pivots.find(value=>value.index===index),candle=candles[index];if(pivot&&candle)markers.push({id:`wave-${index}`,time:candle.time as UTCTimestamp,position:'atPriceMiddle',price:pivot.price,shape:'circle',color:'#4f8cff',text:scenario.waveLabels[labelIndex],size:1.25})});
    market.analysis.wyckoff.events.forEach(event=>{const candle=candles[event.index];if(candle)markers.push({id:`wyckoff-${event.type}-${event.index}`,time:candle.time as UTCTimestamp,position:'atPriceMiddle',price:event.price,shape:'square',color:'#f5b942',text:event.type,size:1})});
    markers.sort((a,b)=>(a.time as number)-(b.time as number));
    createSeriesMarkers(series,markers,{zOrder:'top',autoScale:true});

    chart.timeScale().setVisibleLogicalRange({from:Math.max(0,candles.length-140),to:candles.length+5});
    const observer=new ResizeObserver(resizeChart);
    observer.observe(root);
    return()=>{observer.disconnect();chart.remove()};
  },[interval,market,symbol]);

  return <div className="relative aspect-square w-full md:aspect-video"><div ref={container} className="absolute inset-0"/>{!market&&<div className="absolute inset-0 grid place-items-center text-xs text-neutral">차트 데이터를 불러오는 중입니다.</div>}<div className="pointer-events-none absolute left-3 top-3 rounded bg-[#0d131b]/80 px-2 py-1 text-[10px] font-medium text-neutral">{symbol.replace(':',' · ')} · {interval}</div></div>;
}
