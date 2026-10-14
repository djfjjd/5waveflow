import {useEffect,useRef} from 'react';
import {useTranslation} from 'react-i18next';

type Props={symbol:string;title:string;href:string};

export default function TradingViewQuoteCard({symbol,title,href}:Props){
  const ref=useRef<HTMLDivElement>(null);
  const{i18n}=useTranslation();
  const locale=i18n.resolvedLanguage?.startsWith('ko')?'kr':'en';

  useEffect(()=>{
    const root=ref.current;
    if(!root)return;
    root.replaceChildren();
    const widget=document.createElement('div');
    widget.className='tradingview-widget-container__widget w-full';
    const script=document.createElement('script');
    script.src='https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js';
    script.type='text/javascript';
    script.async=true;
    script.textContent=JSON.stringify({symbol,width:'100%',isTransparent:true,colorTheme:'dark',locale});
    root.append(widget,script);
    return()=>root.replaceChildren();
  },[symbol,locale]);

  return <article className="card min-w-0 overflow-hidden">
    <div className="flex items-center justify-between border-b border-[#25303c] px-4 py-3"><h2 className="text-sm font-semibold">{title}</h2><span className="text-[10px] text-neutral">LIVE · TradingView</span></div>
    <div ref={ref} className="tradingview-widget-container min-h-[96px] w-full px-2 py-3"/>
    <div className="px-4 pb-3 text-right text-[10px] text-neutral"><a href={href} rel="noopener nofollow" target="_blank" className="text-primary hover:underline">상세 시세</a> by TradingView</div>
  </article>
}
