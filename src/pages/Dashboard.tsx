import {useQuery} from '@tanstack/react-query';
import {BarChart3,BrainCircuit,CalendarDays,Layers3} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import TradingViewAnalysisChart from '../components/TradingViewAnalysisChart';
import TradingViewQuoteCard from '../components/TradingViewQuoteCard';
import UpbitQuoteCard from '../components/UpbitQuoteCard';
import {getMarket} from '../lib/api';
import {scenarioScores} from '../lib/scenarioScores';

export default function Dashboard(){
  const{t,i18n}=useTranslation();
  const symbol='BTCUSDT';
  const queries=['BTCUSDT','ETHUSDT'].map(s=>useQuery({queryKey:['market',s,'1h','usdt'],queryFn:()=>getMarket(s,'1h','usdt'),refetchInterval:60_000}));
  const active=queries[symbol==='BTCUSDT'?0:1];
  const directionScores=scenarioScores(active.data);
  const bullish=active.data?directionScores.bullish:null;
  const sideways=active.data?directionScores.sideways:null;
  const bearish=active.data?directionScores.bearish:null;
  const isKorean=i18n.resolvedLanguage?.startsWith('ko');
  const today=new Intl.DateTimeFormat(isKorean?'ko-KR':'en-US',{year:'numeric',month:'long',day:'numeric',weekday:'long',timeZone:'Asia/Seoul'}).format(new Date());

  return <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-12">
    <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs text-neutral"><CalendarDays size={14}/><span>{t('today')}</span><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bullish"/></div>
        <div className="flex items-baseline gap-2"><h1 className="text-2xl font-semibold tracking-tight tabular-nums md:text-4xl">{today}</h1><span className="shrink-0 text-[10px] text-neutral md:text-xs">(+9 UTC)</span></div>
      </div>
      <div className="flex items-center rounded-xl border border-[#26303d] bg-surface/70 px-3 py-3 text-xs tabular-nums sm:px-4 sm:text-sm">
        <span className="shrink-0 text-neutral">{t('marketDirection')}</span>
        <div className="ml-auto flex items-center justify-end gap-2 sm:ml-4 sm:gap-4">
          <span className="text-bullish">{t('bullish')} <strong>{bullish===null?'—':bullish}%</strong></span>
          <span className="h-4 w-px bg-[#35404d]"/>
          <span className="text-neutral">횡보 <strong className="text-white">{sideways===null?'—':sideways}%</strong></span>
          <span className="h-4 w-px bg-[#35404d]"/>
          <span className="text-bearish">{t('bearish')} <strong>{bearish===null?'—':bearish}%</strong></span>
        </div>
      </div>
    </section>

    <section className="grid grid-cols-3 gap-2 sm:gap-4">
      <TradingViewQuoteCard symbol="BINANCE:BTCUSDT" title="BTC / USDT · Binance Spot" href="https://www.tradingview.com/symbols/BTCUSDT/?exchange=BINANCE"/>
      <UpbitQuoteCard/>
      <TradingViewQuoteCard symbol="FX_IDC:USDKRW" title="USD / KRW · Exchange Rate" href="https://www.tradingview.com/symbols/USDKRW/?exchange=FX_IDC"/>
    </section>

    <section className="mt-6"><div className="mb-3 flex items-center justify-between"><h2 className="label">BTC / USDT ANALYSIS CHART</h2><div className="flex gap-3"><Link className="text-[11px] text-primary" to="/wallpaper">라이브 월페이퍼</Link><Link className="text-[11px] text-primary" to={`/analysis/${symbol}`}>상세 분석 →</Link></div></div><div className="card overflow-hidden p-2"><TradingViewAnalysisChart symbol={`${active.data?.provider==='Kraken Spot'?'KRAKEN':'BINANCE'}:${symbol}`} interval="1h" market={active.data}/><div className="px-2 pb-1 pt-2 text-right text-[10px] text-neutral">Powered by TradingView Lightweight Charts</div></div></section>

    <section className="mt-8"><div className="mb-4 flex items-center justify-between"><Link to="/technical-analysis" className="label hover:text-primary">AI {t('probability')} · {t('technical')}</Link><Link className="text-xs text-primary" to={`/analysis/${symbol}`}>상세 분석 →</Link></div><div className="grid grid-cols-4 gap-2 md:gap-4"><ProbabilityCard market={active.data} symbol={symbol}/><PatternCard icon={<Layers3/>} title="Elliott Wave" summary={active.data?.analysis.elliott.scenarios[0]?.label||`${active.data?.analysis.elliott.pivots.filter(pivot=>pivot.confirmed).length??0}개 피벗`} text={active.data?.analysis.elliott.detail||'실제 데이터 대기 중'} symbol={symbol}/><PatternCard icon={<BarChart3/>} title="Wyckoff Phase" summary={active.data?.analysis.wyckoff.phase?`Phase ${active.data.analysis.wyckoff.phase}`:'Trading Range'} text={active.data?.analysis.wyckoff.detail||'실제 데이터 대기 중'} symbol={symbol}/><IndicatorsCard market={active.data} symbol={symbol}/></div></section>
  </main>
}

function PatternCard({icon,title,summary,text,symbol}:{icon:React.ReactNode;title:string;summary:string;text:string;symbol:string}){return <Link to={`/analysis/${symbol}`} className="card aspect-[3/2] min-w-0 overflow-hidden p-2 transition-colors hover:border-primary/70 sm:p-5"><div className="mb-5 hidden h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex sm:[&>svg]:h-6 sm:[&>svg]:w-6">{icon}</div><h3 className="break-words text-[8px] font-semibold leading-[10px] sm:text-base sm:leading-tight">{title}</h3><p className="mt-1 break-words text-[8px] leading-[10px] text-primary sm:hidden">{summary}</p><p className="mt-2 hidden break-words text-sm leading-6 text-neutral sm:block">{text}</p></Link>}
function ProbabilityCard({market,symbol}:{market:Awaited<ReturnType<typeof getMarket>>|undefined;symbol:string}){const scores=scenarioScores(market);const strongest=[['상승',scores.bullish],['횡보',scores.sideways],['하락',scores.bearish]].sort((a,b)=>(b[1] as number)-(a[1] as number))[0];const rows=[{label:'상승',color:'#00C896',value:scores.bullish},{label:'횡보',color:'#8B95A5',value:scores.sideways},{label:'하락',color:'#FF5C70',value:scores.bearish}];return <Link to={`/analysis/${symbol}`} className="card aspect-[3/2] min-w-0 overflow-hidden p-2 transition-colors hover:border-primary/70 sm:p-5"><div className="label mb-4 hidden break-words text-xs sm:block">QUANT SIGNAL</div><div className="text-[8px] leading-[10px] text-primary sm:hidden">{market?`${strongest[0]} ${strongest[1]}점`:'계산 중'}</div><div className="hidden space-y-2 sm:block">{rows.map(row=><div key={row.label}><div className="mb-1 flex justify-between text-xs"><span>{row.label}</span><span className="text-neutral">{market?`${row.value}점`:'—'}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#242d38]"><div className="h-full" style={{width:market?`${row.value}%`:'0%',backgroundColor:row.color}}/></div></div>)}</div></Link>}
function IndicatorsCard({market,symbol}:{market:Awaited<ReturnType<typeof getMarket>>|undefined;symbol:string}){const i=market?.indicators;const missing=!i||[i.rsi,i.macd,i.signal,i.ema20,i.ema50,i.ema200,i.volumeChangePercent].some(value=>value==null);const macd=i?.macd!=null&&i.signal!=null?(i.macd>=i.signal?'상승 우위':'하락 우위'):'데이터 부족';const emaOrder=i?.ema20!=null&&i.ema50!=null&&i.ema200!=null?(i.ema20>i.ema50&&i.ema50>i.ema200?'정배열':i.ema20<i.ema50&&i.ema50<i.ema200?'역배열':'혼조'):'데이터 부족';return <Link to={`/analysis/${symbol}`} className="card aspect-[3/2] min-w-0 overflow-hidden p-2 transition-colors hover:border-primary/70 sm:p-5"><div className="mb-3 hidden h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex sm:[&>svg]:h-6 sm:[&>svg]:w-6"><BrainCircuit/></div><h3 className="text-[8px] font-semibold leading-[10px] sm:text-base sm:leading-tight">Indicators</h3><p className="mt-1 text-[8px] leading-[10px] text-primary sm:hidden">RSI {i?.rsi?.toFixed(1)??'—'}<br/>{macd}</p><dl className="mt-2 hidden grid-cols-2 gap-x-3 gap-y-1 text-[11px] sm:grid"><Metric name="RSI 14" value={i?.rsi==null?'데이터 부족':i.rsi.toFixed(1)}/><Metric name="MACD" value={macd}/><Metric name="EMA" value={emaOrder}/><Metric name="거래량" value={i?.volumeChangePercent==null?'데이터 부족':`${i.volumeChangePercent>=0?'+':''}${i.volumeChangePercent.toFixed(1)}%`}/><Metric name="분석 기준" value={market?.analysisTime??'—'}/><Metric name="갱신" value={market?new Intl.DateTimeFormat('ko-KR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(market.updatedAt)):'—'}/></dl>{missing&&<span className="mt-1 hidden text-[10px] text-bearish sm:block">일부 지표 데이터 부족</span>}</Link>}
function Metric({name,value}:{name:string;value:string}){return <div className="min-w-0"><dt className="text-neutral">{name}</dt><dd className="truncate font-medium tabular-nums">{value}</dd></div>}
