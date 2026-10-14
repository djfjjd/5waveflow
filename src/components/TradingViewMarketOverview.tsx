import {useEffect,useRef} from 'react';
import {useTranslation} from 'react-i18next';

export default function TradingViewMarketOverview(){
  const container=useRef<HTMLDivElement>(null);
  const{ i18n }=useTranslation();
  const locale=i18n.resolvedLanguage?.startsWith('ko')?'kr':'en';

  useEffect(()=>{
    const root=container.current;
    if(!root)return;
    const chartHeight=window.matchMedia('(min-width: 768px)').matches?720:630;
    root.replaceChildren();
    root.style.height=`${chartHeight}px`;
    const widget=document.createElement('div');
    widget.className='tradingview-widget-container__widget h-full w-full';
    widget.style.height='100%';
    widget.style.width='100%';
    const script=document.createElement('script');
    script.src='https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type='text/javascript';
    script.async=true;
    script.textContent=JSON.stringify({
      autosize:false,
      width:'100%',
      height:chartHeight,
      symbol:'BINANCE:BTCUSDT',
      interval:'60',
      timezone:'Asia/Seoul',
      theme:'dark',
      style:'1',
      locale,
      backgroundColor:'#151B23',
      gridColor:'rgba(139, 149, 165, 0.08)',
      hide_top_toolbar:false,
      hide_side_toolbar:false,
      hide_legend:false,
      hide_volume:false,
      allow_symbol_change:true,
      save_image:false,
      calendar:false,
      details:false,
      hotlist:false,
      withdateranges:true,
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
  },[locale]);

  return <section className="mt-6">
    <div className="mb-3 flex items-center justify-between"><h2 className="label">TRADINGVIEW CANDLE CHART</h2><span className="text-[11px] text-neutral">Official widget</span></div>
    <div className="card overflow-hidden p-2">
      <div ref={container} className="tradingview-widget-container h-[630px] w-full md:h-[720px]"/>
      <div className="px-2 pb-1 text-right text-[10px] text-neutral"><a href="https://www.tradingview.com/symbols/BTCUSDT/" rel="noopener nofollow" target="_blank" className="text-primary hover:underline">BTCUSDT chart</a> by TradingView</div>
    </div>
  </section>
}
