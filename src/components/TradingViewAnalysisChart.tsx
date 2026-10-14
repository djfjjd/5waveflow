import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {useTranslation} from 'react-i18next';
import type {MarketPayload} from '../types';

type Props={symbol:string;interval:string;analysis?:MarketPayload['analysis']};

const intervals:Record<string,string>={'15m':'15','30m':'30','1h':'60','4h':'240','1d':'D','1w':'W'};
const studies=[{id:'RSI@tv-basicstudies',inputs:{length:14}}];

export default function TradingViewAnalysisChart({symbol,interval,analysis}:Props){
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
  return <div className="relative"><div ref={container} className="tradingview-widget-container aspect-square w-full md:aspect-video"/><AnalysisOverlay analysis={analysis} korean={locale==='kr'}/></div>;
}

function AnalysisOverlay({analysis,korean}:{analysis:MarketPayload['analysis']|undefined;korean:boolean}){
  const elliott=analysis?.elliott,scenario=elliott?.scenarios[0];
  const confirmedPivots=elliott?.pivots.filter(pivot=>pivot.confirmed).length??0;
  const waveText=scenario?scenario.waveLabels.join(' → '):(korean?`확정 피벗 ${confirmedPivots}개`:`${confirmedPivots} confirmed pivots`);
  const events=analysis?.wyckoff.events.slice(-4).map(event=>event.type).join(' · ');
  const wyckoffText=analysis?.wyckoff.phase?`Phase ${analysis.wyckoff.phase}${events?` · ${events}`:''}`:(events||(korean?'이벤트 판정 대기':'Awaiting event confirmation'));
  return <div className="pointer-events-none absolute left-2 top-12 z-10 max-w-[calc(100%-1rem)] space-y-1.5 md:left-4 md:top-16">
    <div className="w-fit max-w-full rounded-md border border-primary/30 bg-[#0d131b]/90 px-2 py-1.5 shadow-lg backdrop-blur-sm md:px-3 md:py-2"><div className="text-[8px] font-semibold tracking-wider text-primary md:text-[10px]">ELLIOTT WAVE</div><div className="mt-0.5 truncate text-[9px] font-medium md:text-xs">{scenario?.label??(korean?'유효 파동 후보 대기':'Awaiting valid wave candidate')} · {waveText}</div></div>
    <div className="w-fit max-w-full rounded-md border border-[#8b95a5]/30 bg-[#0d131b]/90 px-2 py-1.5 shadow-lg backdrop-blur-sm md:px-3 md:py-2"><div className="text-[8px] font-semibold tracking-wider text-neutral md:text-[10px]">WYCKOFF</div><div className="mt-0.5 truncate text-[9px] font-medium md:text-xs">{wyckoffText}</div></div>
  </div>
}
