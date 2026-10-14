import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {useTranslation} from 'react-i18next';
import type {MarketPayload} from '../types';

type Props={symbol:string;interval:string;market?:MarketPayload};

const intervals:Record<string,string>={'15m':'15','30m':'30','1h':'60','4h':'240','1d':'D','1w':'W'};
const studies=[{id:'RSI@tv-basicstudies',inputs:{length:14}}];

export default function TradingViewAnalysisChart({symbol,interval,market}:Props){
  const container=useRef<HTMLDivElement>(null);
  const[height,setHeight]=useState(0);
  const{i18n}=useTranslation();
  const locale=i18n.resolvedLanguage?.startsWith('ko')?'kr':'en';

  useLayoutEffect(()=>{const root=container.current;if(!root)return;const observer=new ResizeObserver(([entry])=>setHeight(Math.round(entry.contentRect.width*(window.matchMedia('(max-width: 767px)').matches?1:9/16))));observer.observe(root);return()=>observer.disconnect()},[]);
  useEffect(()=>{
    const root=container.current;
    if(!root||!height)return;
    root.replaceChildren();
    const widget=document.createElement('div');
    widget.className='tradingview-widget-container__widget h-full w-full';
    widget.style.height='100%';
    const script=document.createElement('script');
    script.src='https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type='text/javascript';script.async=true;
    script.textContent=JSON.stringify({autosize:false,width:'100%',height,symbol,interval:intervals[interval]??'60',timezone:'Asia/Seoul',theme:'dark',style:'1',locale,backgroundColor:'#151B23',gridColor:'rgba(139, 149, 165, 0.08)',hide_top_toolbar:false,hide_side_toolbar:false,hide_legend:false,hide_volume:true,allow_symbol_change:false,save_image:false,calendar:false,withdateranges:true,studies,support_host:'https://www.tradingview.com'});
    root.append(widget,script);
    return()=>root.replaceChildren();
  },[height,interval,locale,symbol]);
  return <div className="relative"><div ref={container} className="tradingview-widget-container aspect-square w-full md:aspect-video"/><AnalysisMarkers market={market}/></div>;
}

function AnalysisMarkers({market}:{market:MarketPayload|undefined}){
  if(!market)return null;
  const candles=market.candles,scenario=market.analysis.elliott.scenarios[0];
  const start=Math.max(0,candles.length-160),visible=candles.slice(start);
  if(!visible.length)return null;
  const high=Math.max(...visible.map(candle=>candle.high)),low=Math.min(...visible.map(candle=>candle.low)),range=Math.max(high-low,Number.EPSILON);
  const position=(index:number,price:number)=>({left:`${8+((index-start)/Math.max(visible.length-1,1))*82}%`,top:`${16+((high-price)/range)*54}%`});
  const waves=scenario?scenario.pivotIndexes.flatMap((index,labelIndex)=>{const pivot=market.analysis.elliott.pivots.find(value=>value.index===index);return index>=start&&pivot?[{key:`wave-${index}`,index,price:pivot.price,label:scenario.waveLabels[labelIndex]}]:[]}):[];
  const events=market.analysis.wyckoff.events.filter(event=>event.index>=start&&event.index<candles.length).slice(-8);
  return <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
    {waves.map(marker=><span key={marker.key} style={position(marker.index,marker.price)} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary bg-[#0d131b]/95 px-1.5 py-0.5 text-[9px] font-bold leading-none text-primary shadow-lg md:px-2 md:py-1 md:text-xs">{marker.label}</span>)}
    {events.map(event=><span key={`${event.type}-${event.index}`} style={position(event.index,event.price)} className="absolute -translate-x-1/2 translate-y-2 rounded border border-[#f5b942]/70 bg-[#0d131b]/95 px-1 py-0.5 text-[8px] font-semibold leading-none text-[#f5b942] shadow-lg md:px-1.5 md:py-1 md:text-[10px]">{event.type}</span>)}
  </div>
}
