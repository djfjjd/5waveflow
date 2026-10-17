import {useEffect,useRef} from 'react';
import {useTranslation} from 'react-i18next';
import {useSiteTheme} from '../lib/useSiteTheme';

type Props={symbol:string};

export default function TradingViewQuoteCard({symbol}:Props){
  const ref=useRef<HTMLDivElement>(null);
  const{i18n}=useTranslation();
  const theme=useSiteTheme();
  const locale=i18n.resolvedLanguage?.startsWith('ko')?'kr':'en';
  useEffect(()=>{
    const root=ref.current;
    if(!root)return;
    root.replaceChildren();
    const widget=document.createElement('div');
    widget.className='quote-widget-frame tradingview-widget-container__widget h-full w-full';
    widget.style.height='100%';
    const script=document.createElement('script');
    script.src='https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js';
    script.type='text/javascript';
    script.async=true;
    script.textContent=JSON.stringify({symbol,width:'100%',height:'100%',isTransparent:false,colorTheme:theme,locale});
    root.append(widget,script);
    return()=>root.replaceChildren();
  },[symbol,locale,theme]);

  return <article className="min-w-0 overflow-hidden bg-transparent">
    <div className="h-[82px] w-full overflow-hidden px-1 py-2 sm:h-[96px] sm:px-2 sm:py-3"><div ref={ref} className="quote-widget-content tradingview-widget-container h-[120px] w-full sm:h-[72px]"/></div>
  </article>
}
