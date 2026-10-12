import {useEffect,useRef} from 'react';
import {useTranslation} from 'react-i18next';

export default function TradingViewMarketOverview(){
  const container=useRef<HTMLDivElement>(null);
  const{ i18n }=useTranslation();
  const locale=i18n.resolvedLanguage?.startsWith('ko')?'kr':'en';

  useEffect(()=>{
    const root=container.current;
    if(!root)return;
    root.replaceChildren();
    const widget=document.createElement('div');
    widget.className='tradingview-widget-container__widget h-full w-full';
    const script=document.createElement('script');
    script.src='https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
    script.type='text/javascript';
    script.async=true;
    script.textContent=JSON.stringify({
      colorTheme:'dark',dateRange:'1D',locale,largeChartUrl:'',isTransparent:true,
      showFloatingTooltip:true,width:'100%',height:'100%',showSymbolLogo:true,showChart:true,
      plotLineColorGrowing:'rgba(0, 200, 150, 1)',plotLineColorFalling:'rgba(255, 92, 112, 1)',
      gridLineColor:'rgba(139, 149, 165, 0.08)',scaleFontColor:'#8B95A5',
      belowLineFillColorGrowing:'rgba(0, 200, 150, 0.12)',belowLineFillColorFalling:'rgba(255, 92, 112, 0.12)',
      belowLineFillColorGrowingBottom:'rgba(0, 200, 150, 0)',belowLineFillColorFallingBottom:'rgba(255, 92, 112, 0)',
      symbolActiveColor:'rgba(79, 140, 255, 0.12)',
      tabs:[
        {title:locale==='kr'?'암호화폐':'Crypto',symbols:[{s:'BINANCE:BTCUSDT',d:'Bitcoin / Tether'},{s:'BINANCE:ETHUSDT',d:'Ethereum / Tether'},{s:'BINANCE:SOLUSDT',d:'Solana / Tether'},{s:'BINANCE:XRPUSDT',d:'XRP / Tether'}]},
        {title:locale==='kr'?'주요 지수':'Indices',symbols:[{s:'FOREXCOM:SPXUSD',d:'S&P 500'},{s:'NASDAQ:NDX',d:'Nasdaq 100'},{s:'TVC:DJI',d:'Dow Jones'},{s:'TVC:NI225',d:'Nikkei 225'}]}
      ]
    });
    root.append(widget,script);
    return()=>root.replaceChildren();
  },[locale]);

  return <section className="mt-6">
    <div className="mb-3 flex items-center justify-between"><h2 className="label">TRADINGVIEW MARKET OVERVIEW</h2><span className="text-[11px] text-neutral">Official widget</span></div>
    <div className="card overflow-hidden p-2">
      <div ref={container} className="tradingview-widget-container h-[520px] w-full"/>
      <div className="px-2 pb-1 text-right text-[10px] text-neutral"><a href="https://www.tradingview.com/markets/" rel="noopener nofollow" target="_blank" className="text-primary hover:underline">Market data</a> by TradingView</div>
    </div>
  </section>
}
