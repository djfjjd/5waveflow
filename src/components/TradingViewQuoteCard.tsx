import {useEffect,useRef} from 'react';
import {useTranslation} from 'react-i18next';

type Props={symbol:string;title:string};

export default function TradingViewQuoteCard({symbol,title}:Props){
  const ref=useRef<HTMLDivElement>(null);
  const{i18n}=useTranslation();
  const locale=i18n.resolvedLanguage?.startsWith('ko')?'kr':'en';
  const shortTitle=title.split('·')[0].trim();

  useEffect(()=>{
    const root=ref.current;
    if(!root)return;
    root.replaceChildren();
    const widget=document.createElement('div');
    widget.className='tradingview-widget-container__widget h-full w-full';
    widget.style.height='100%';
    const script=document.createElement('script');
    script.src='https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js';
    script.type='text/javascript';
    script.async=true;
    script.textContent=JSON.stringify({symbol,width:'100%',height:'100%',isTransparent:true,colorTheme:'dark',locale});
    root.append(widget,script);
    return()=>root.replaceChildren();
  },[symbol,locale]);

  return <article className="card min-w-0 overflow-hidden">
    <div className="flex min-w-0 items-center justify-between border-b border-[#25303c] px-2 py-2 sm:px-4 sm:py-3"><h2 className="min-w-0 whitespace-nowrap text-[9px] font-semibold tracking-tight sm:text-sm"><span className="sm:hidden">{shortTitle}</span><span className="hidden sm:inline">{title}</span></h2><span className="hidden text-[10px] text-neutral md:block">LIVE · TradingView</span></div>
    <div className="h-[82px] w-full overflow-hidden px-1 py-2 sm:h-[96px] sm:px-2 sm:py-3"><div ref={ref} className="quote-widget-content tradingview-widget-container h-[120px] w-full sm:h-[72px]"/></div>
  </article>
}
