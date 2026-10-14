import {useQuery} from '@tanstack/react-query';
import {BarChart3,BrainCircuit,CalendarDays,Layers3,ShieldCheck} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import TradingViewMarketOverview from '../components/TradingViewMarketOverview';
import TradingViewQuoteCard from '../components/TradingViewQuoteCard';
import UpbitQuoteCard from '../components/UpbitQuoteCard';
import {getMarket} from '../lib/api';

export default function Dashboard(){
  const{t}=useTranslation();
  const symbol='BTCUSDT';
  const queries=['BTCUSDT','ETHUSDT'].map(s=>useQuery({queryKey:['market',s,'1h'],queryFn:()=>getMarket(s,'1h'),refetchInterval:60_000}));
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

    <section className="grid grid-cols-3 gap-2 sm:gap-4">
      <TradingViewQuoteCard symbol="BINANCE:BTCUSDT" title="BTC / USDT · Binance Spot" href="https://www.tradingview.com/symbols/BTCUSDT/?exchange=BINANCE"/>
      <UpbitQuoteCard/>
      <TradingViewQuoteCard symbol="FX_IDC:USDKRW" title="USD / KRW · Exchange Rate" href="https://www.tradingview.com/symbols/USDKRW/?exchange=FX_IDC"/>
    </section>

    <TradingViewMarketOverview/>

    <section className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="label">AI {t('probability')} · {t('technical')}</h2><Link className="text-xs text-primary" to={`/analysis/${symbol}`}>상세 분석 →</Link></div><div className="grid grid-cols-4 gap-2 md:gap-4"><ProbabilityCard t={t}/><AnalysisCard icon={<Layers3/>} title="Elliott Wave" text={active.data?.analysis.elliott.detail||'실제 데이터 대기 중'}/><AnalysisCard icon={<BarChart3/>} title="Wyckoff Phase" text={active.data?.analysis.wyckoff.detail||'실제 데이터 대기 중'}/><AnalysisCard icon={<BrainCircuit/>} title="Indicators" text={active.data?.indicators.rsi!=null?`RSI ${active.data.indicators.rsi.toFixed(1)} · MACD ${active.data.indicators.macd?.toFixed(2)??'—'}`:'지표 계산 대기 중'}/></div></section>
    <section className="card mt-8 flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center"><div><div className="label">PREDICTION HISTORY</div><p className="mt-2 text-sm text-neutral">검증 가능한 예측 기록과 모델 성능은 모델 학습 이후 제공됩니다.</p></div><Link to="/history" className="rounded-lg border border-[#354252] px-4 py-2 text-center text-sm">검증 상태 보기</Link></section>
  </main>
}

function AnalysisCard({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="card min-w-0 p-2 sm:p-5"><div className="mb-3 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary sm:mb-5 sm:h-9 sm:w-9">{icon}</div><h3 className="break-words text-[11px] font-semibold leading-tight sm:text-base">{title}</h3><p className="mt-2 break-words text-[10px] leading-4 text-neutral sm:text-sm sm:leading-6">{text}</p></div>}
function ProbabilityCard({t}:{t:(key:string)=>string}){return <div className="card min-w-0 p-2 sm:p-5"><div className="label mb-3 break-words text-[9px] sm:mb-5 sm:text-xs">AI {t('probability')}</div><div className="space-y-2 sm:space-y-3">{[['상승','bullish'],['횡보','neutral'],['하락','bearish']].map(([x,c])=><div key={x}><div className="mb-1 flex justify-between text-[9px] sm:mb-1.5 sm:text-xs"><span>{x}</span><span className="text-neutral">—</span></div><div className="h-1 overflow-hidden rounded-full bg-[#242d38] sm:h-1.5"><div className={`h-full w-0 bg-${c}`}/></div></div>)}</div><div className="mt-3 flex min-w-0 items-center gap-1 text-[9px] text-primary sm:mt-4 sm:gap-2 sm:text-xs"><ShieldCheck className="shrink-0" size={12}/><span className="break-words">{t('preparing')}</span></div></div>}
