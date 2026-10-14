import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {useTranslation} from 'react-i18next';

type Props={symbol:string;interval:string};

const intervals:Record<string,string>={'15m':'15','30m':'30','1h':'60','4h':'240','1d':'D','1w':'W'};
const studies=['RSI@tv-basicstudies','MACD@tv-basicstudies','MAExp@tv-basicstudies','BB@tv-basicstudies'];

export default function TradingViewAnalysisChart({symbol,interval}:Props){
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
    script.textContent=JSON.stringify({autosize:false,width:'100%',height,symbol,interval:intervals[interval]??'60',timezone:'Asia/Seoul',theme:'dark',style:'1',locale,backgroundColor:'#151B23',gridColor:'rgba(139, 149, 165, 0.08)',hide_top_toolbar:false,hide_side_toolbar:false,hide_legend:false,hide_volume:false,allow_symbol_change:false,save_image:false,calendar:false,withdateranges:true,studies,studies_overrides:{'moving average exponential.length':20,'bollinger bands.length':20,'bollinger bands.mult':2},support_host:'https://www.tradingview.com'});
    root.append(widget,script);
    return()=>root.replaceChildren();
  },[height,interval,locale,symbol]);
  return <div ref={container} className="tradingview-widget-container aspect-square w-full md:aspect-video"/>;
}
