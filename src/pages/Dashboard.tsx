import {useQuery} from '@tanstack/react-query';
import {BarChart3,BrainCircuit,CalendarDays,Layers3,RefreshCw,ShieldCheck} from 'lucide-react';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import MarketChart from '../components/MarketChart';
import TradingViewMarketOverview from '../components/TradingViewMarketOverview';
import TradingViewQuoteCard from '../components/TradingViewQuoteCard';
import {getMarket} from '../lib/api';

const periods=[['1H','1m'],['4H','5m'],['1D','15m'],['7D','1h']];

export default function Dashboard(){
  const{t}=useTranslation();
  const symbol='BTCUSDT';
  const[interval,setInterval]=useState('1h');
  const queries=['BTCUSDT','ETHUSDT'].map(s=>useQuery({queryKey:['market',s,s===symbol?interval:'1h'],queryFn:()=>getMarket(s,s===symbol?interval:'1h'),refetchInterval:60_000}));
  const active=queries[symbol==='BTCUSDT'?0:1];
  const tickers=queries.flatMap(query=>query.data?[query.data.ticker]:[]);
  const bullish=tickers.length?Math.round(tickers.filter(ticker=>ticker.changePercent>0).length/tickers.length*100):null;
  const bearish=tickers.length?Math.round(tickers.filter(ticker=>ticker.changePercent<0).length/tickers.length*100):null;
  const today=new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(new Date());

  return <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-12">
    <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs text-neutral"><CalendarDays size={14}/><span>{t('today')}</span><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bullish"/></div>
        <h1 className="text-2xl font-semibold tracking-tight tabular-nums md:text-4xl">{today}</h1>
      </div>
      <div className="flex items-center gap-4 rounded-xl border border-[#26303d] bg-surface/70 px-4 py-3 text-sm tabular-nums">
        <span className="text-neutral">{t('marketDirection')}</span>
        <span className="text-bullish">{t('bullish')} <strong>{bullish===null?'—':bullish}%</strong></span>
        <span className="h-4 w-px bg-[#35404d]"/>
        <span className="text-bearish">{t('bearish')} <strong>{bearish===null?'—':bearish}%</strong></span>
      </div>
    </section>

    <section className="grid gap-4 lg:grid-cols-3">
      <TradingViewQuoteCard symbol="BINANCE:BTCUSDT" title="BTC / USDT · Binance Spot" href="https://www.tradingview.com/symbols/BTCUSDT/?exchange=BINANCE"/>
      <TradingViewQuoteCard symbol="TVC:KOSPI" title="KOSPI Composite Index" href="https://www.tradingview.com/symbols/TVC-KOSPI/"/>
      <TradingViewQuoteCard symbol="FX_IDC:USDKRW" title="USD / KRW · Exchange Rate" href="https://www.tradingview.com/symbols/USDKRW/?exchange=FX_IDC"/>
    </section>

    <TradingViewMarketOverview/>

    <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="card min-w-0 overflow-hidden"><div className="flex flex-wrap items-center justify-between border-b border-[#25303c] px-5 py-4"><div><div className="font-semibold">{symbol.replace('USDT',' / USDT')}</div><div className="mt-1 text-xs text-neutral">Binance public market data</div></div><div className="flex gap-1 rounded-lg bg-background p-1">{periods.map(([label,value])=><button key={label} onClick={()=>setInterval(value)} className={`focus-ring rounded-md px-3 py-1.5 text-xs ${interval===value?'bg-primary text-white':'text-neutral'}`}>{label}</button>)}</div></div><div className="p-2 md:p-4">{active.data?<MarketChart candles={active.data.candles} ema20 ema50/>:<div className="grid h-[410px] place-items-center text-neutral"><RefreshCw className="animate-spin"/></div>}</div></div>
      <aside className="card order-first p-6 xl:order-none"><div className="label mb-6">AI {t('probability')}</div><div className="grid grid-cols-3 gap-2 xl:block xl:space-y-5">{[['상승','bullish'],['횡보','neutral'],['하락','bearish']].map(([x,c])=><div key={x}><div className="mb-2 flex justify-between text-sm"><span>{x}</span><span className="text-neutral">—</span></div><div className="h-2 overflow-hidden rounded-full bg-[#242d38]"><div className={`h-full w-0 bg-${c}`}/></div></div>)}</div><div className="mt-7 rounded-xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-center gap-2 text-sm text-primary"><ShieldCheck size={16}/>{t('preparing')}</div><p className="mt-2 text-xs leading-5 text-neutral">{t('noFake')}</p></div></aside>
    </section>

    <section className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="label">{t('technical')}</h2><Link className="text-xs text-primary" to={`/analysis/${symbol}`}>상세 분석 →</Link></div><div className="grid gap-4 md:grid-cols-3"><AnalysisCard icon={<Layers3/>} title="Elliott Wave" text={active.data?.analysis.elliott.detail||'실제 데이터 대기 중'}/><AnalysisCard icon={<BarChart3/>} title="Wyckoff Phase" text={active.data?.analysis.wyckoff.detail||'실제 데이터 대기 중'}/><AnalysisCard icon={<BrainCircuit/>} title="Indicators" text={active.data?.indicators.rsi!=null?`RSI ${active.data.indicators.rsi.toFixed(1)} · MACD ${active.data.indicators.macd?.toFixed(2)??'—'}`:'지표 계산 대기 중'}/></div></section>
    <section className="card mt-8 flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center"><div><div className="label">PREDICTION HISTORY</div><p className="mt-2 text-sm text-neutral">검증 가능한 예측 기록과 모델 성능은 모델 학습 이후 제공됩니다.</p></div><Link to="/history" className="rounded-lg border border-[#354252] px-4 py-2 text-center text-sm">검증 상태 보기</Link></section>
  </main>
}

function AnalysisCard({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="card p-5"><div className="mb-5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-neutral">{text}</p></div>}
