import {useEffect,useRef} from 'react';
import {useTranslation} from 'react-i18next';

type Props={symbol:string;title:string;interval?:string;href:string};

export default function TradingViewMiniChart({symbol,title,interval='60',href}:Props){
  const ref=useRef<HTMLDivElement>(null);
  const{i18n}=useTranslation();
  const locale=i18n.resolvedLanguage?.startsWith('ko')?'kr':'en';

  useEffect(()=>{
    const root=ref.current;
    if(!root)return;
    root.replaceChildren();
    const widget=document.createElement('div');
    widget.className='tradingview-widget-container__widget h-full w-full';
    const script=document.createElement('script');
    script.src='https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type='text/javascript';
    script.async=true;
    script.textContent=JSON.stringify({
      autosize:true,symbol,interval,timezone:'Asia/Seoul',theme:'dark',style:'1',locale,
      backgroundColor:'#151B23',gridColor:'rgba(139, 149, 165, 0.08)',
      hide_top_toolbar:true,hide_side_toolbar:true,hide_legend:false,hide_volume:true,
      allow_symbol_change:false,save_image:false,calendar:false,details:false,hotlist:false,
      support_host:'https://www.tradingview.com',
      settings_overrides:{
        'mainSeriesProperties.candleStyle.upColor':'#00C896',
        'mainSeriesProperties.candleStyle.downColor':'#FF5C70',
        'mainSeriesProperties.candleStyle.borderUpColor':'#00C896',
        'mainSeriesProperties.candleStyle.borderDownColor':'#FF5C70',
        'mainSeriesProperties.candleStyle.wickUpColor':'#00C896',
        'mainSeriesProperties.candleStyle.wickDownColor':'#FF5C70'
      }
    });
    root.append(widget,script);
    return()=>root.replaceChildren();
  },[symbol,interval,locale]);

  return <article className="card min-w-0 overflow-hidden">
    <div className="flex items-center justify-between border-b border-[#25303c] px-4 py-3"><h2 className="text-sm font-semibold">{title}</h2><span className="text-[10px] text-neutral">TradingView</span></div>
    <div ref={ref} className="tradingview-widget-container h-[140px] w-full"/>
    <div className="px-3 py-2 text-right text-[10px] text-neutral"><a href={href} rel="noopener nofollow" target="_blank" className="text-primary hover:underline">전체 차트</a> by TradingView</div>
  </article>
}
