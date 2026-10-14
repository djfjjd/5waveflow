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

    <section className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="label">AI {t('probability')} · {t('technical')}</h2><Link className="text-xs text-primary" to={`/analysis/${symbol}`}>상세 분석 →</Link></div><div className="grid grid-cols-4 gap-2 md:gap-4"><ProbabilityCard t={t}/><AnalysisCard icon={<Layers3/>} title="Elliott Wave" text={active.data?.analysis.elliott.detail||'실제 데이터 대기 중'}/><AnalysisCard icon={<BarChart3/>} title="Wyckoff Phase" text={active.data?.analysis.wyckoff.detail||'실제 데이터 대기 중'}/><IndicatorsCard market={active.data}/></div></section>
    <section className="card mt-8 flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center"><div><div className="label">PREDICTION HISTORY</div><p className="mt-2 text-sm text-neutral">검증 가능한 예측 기록과 모델 성능은 모델 학습 이후 제공됩니다.</p></div><Link to="/history" className="rounded-lg border border-[#354252] px-4 py-2 text-center text-sm">검증 상태 보기</Link></section>
  </main>
}

function AnalysisCard({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="card aspect-[3/2] min-w-0 overflow-hidden p-2 sm:p-5"><div className="mb-1 flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary [&>svg]:h-3.5 [&>svg]:w-3.5 sm:mb-5 sm:h-9 sm:w-9 sm:rounded-lg sm:[&>svg]:h-6 sm:[&>svg]:w-6">{icon}</div><h3 className="break-words text-[8px] font-semibold leading-[10px] sm:text-base sm:leading-tight">{title}</h3><p className="mt-2 hidden break-words text-sm leading-6 text-neutral sm:block">{text}</p></div>}
function ProbabilityCard({t}:{t:(key:string)=>string}){return <div className="card aspect-[3/2] min-w-0 overflow-hidden p-2 sm:p-5"><div className="label mb-1 break-words text-[8px] leading-[10px] sm:mb-5 sm:text-xs">AI {t('probability')}</div><div className="hidden space-y-3 sm:block">{[['상승','bullish'],['횡보','neutral'],['하락','bearish']].map(([x,c])=><div key={x}><div className="mb-1.5 flex justify-between text-xs"><span>{x}</span><span className="text-neutral">—</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#242d38]"><div className={`h-full w-0 bg-${c}`}/></div></div>)}</div><div className="mt-1 flex min-w-0 items-center gap-1 text-[8px] leading-[10px] text-primary sm:mt-4 sm:gap-2 sm:text-xs"><ShieldCheck className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5"/><span className="break-words">{t('preparing')}</span></div></div>}
function IndicatorsCard({market}:{market:Awaited<ReturnType<typeof getMarket>>|undefined}){const i=market?.indicators;const missing=!i||[i.rsi,i.macd,i.signal,i.ema20,i.ema50,i.ema200,i.volumeChangePercent].some(value=>value==null);const macd=i?.macd!=null&&i.signal!=null?(i.macd>=i.signal?'상승 우위':'하락 우위'):'데이터 부족';const emaOrder=i?.ema20!=null&&i.ema50!=null&&i.ema200!=null?(i.ema20>i.ema50&&i.ema50>i.ema200?'정배열':i.ema20<i.ema50&&i.ema50<i.ema200?'역배열':'혼조'):'데이터 부족';return <div className="card aspect-[3/2] min-w-0 overflow-hidden p-2 sm:p-5"><div className="mb-1 flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary [&>svg]:h-3.5 [&>svg]:w-3.5 sm:mb-3 sm:h-9 sm:w-9 sm:rounded-lg sm:[&>svg]:h-6 sm:[&>svg]:w-6"><BrainCircuit/></div><h3 className="text-[8px] font-semibold leading-[10px] sm:text-base sm:leading-tight">Indicators</h3><dl className="mt-2 hidden grid-cols-2 gap-x-3 gap-y-1 text-[11px] sm:grid"><Metric name="RSI 14" value={i?.rsi==null?'데이터 부족':i.rsi.toFixed(1)}/><Metric name="MACD" value={macd}/><Metric name="EMA" value={emaOrder}/><Metric name="거래량" value={i?.volumeChangePercent==null?'데이터 부족':`${i.volumeChangePercent>=0?'+':''}${i.volumeChangePercent.toFixed(1)}%`}/><Metric name="분석 기준" value={market?.analysisTime??'—'}/><Metric name="갱신" value={market?new Intl.DateTimeFormat('ko-KR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(market.updatedAt)):'—'}/></dl>{missing&&<span className="mt-1 hidden text-[10px] text-bearish sm:block">일부 지표 데이터 부족</span>}</div>}
function Metric({name,value}:{name:string;value:string}){return <div className="min-w-0"><dt className="text-neutral">{name}</dt><dd className="truncate font-medium tabular-nums">{value}</dd></div>}
