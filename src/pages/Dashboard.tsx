import {useQuery} from '@tanstack/react-query';
import {CalendarDays,Search} from 'lucide-react';
import {type FormEvent,useState} from 'react';
import {useTranslation} from 'react-i18next';
import TradingViewAnalysisChart from '../components/TradingViewAnalysisChart';
import TradingViewQuoteCard from '../components/TradingViewQuoteCard';
import UpbitQuoteCard from '../components/UpbitQuoteCard';
import {getMarket} from '../lib/api';
import {scenarioScores} from '../lib/scenarioScores';

export default function Dashboard(){
  const{t,i18n}=useTranslation();
  const[symbol,setSymbol]=useState('BTCUSDT'),[interval,setInterval]=useState('1h'),[search,setSearch]=useState('');
  const crypto=['BTCUSDT','ETHUSDT','SOLUSDT','XRPUSDT'].includes(symbol),market=crypto?'usdt' as const:undefined;
  const active=useQuery({queryKey:['market',symbol,interval,market],queryFn:()=>getMarket(symbol,interval,market),refetchInterval:60_000});
  const directionScores=scenarioScores(active.data);
  const bullish=active.data?directionScores.bullish:null;
  const sideways=active.data?directionScores.sideways:null;
  const bearish=active.data?directionScores.bearish:null;
  const isKorean=i18n.resolvedLanguage?.startsWith('ko');
  const today=new Intl.DateTimeFormat(isKorean?'ko-KR':'en-US',{year:'numeric',month:'long',day:'numeric',weekday:'long',timeZone:'Asia/Seoul'}).format(new Date());
  const chartSymbol=crypto?`${active.data?.provider==='Kraken Spot'?'KRAKEN':'BINANCE'}:${symbol}`:symbol;

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

    <section className="mt-6 space-y-2"><div className="grid grid-cols-[minmax(0,1fr)_112px] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_260px]"><div className="flex min-w-0 gap-1 overflow-x-auto">{['1m','5m','15m','30m','1h','4h','1d','1w'].map(value=><button key={value} onClick={()=>setInterval(value)} className={`shrink-0 rounded-lg px-2 py-2 text-[10px] sm:px-3 sm:text-xs ${interval===value?'bg-primary text-white':'bg-surface text-neutral hover:text-white'}`}>{value}</button>)}</div><form onSubmit={submitSearch} className="flex min-w-0 items-center rounded-lg border border-[#303b48] bg-surface px-2 focus-within:border-primary"><Search size={14} className="shrink-0 text-neutral"/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="심볼 검색" aria-label="메인 심볼 검색" className="min-w-0 flex-1 bg-transparent px-1.5 py-2 text-[11px] text-white outline-none"/></form></div><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><div className="flex min-w-0 gap-1.5 overflow-x-auto pb-1">{QUICK_SYMBOLS.map(item=><button key={item.symbol} onClick={()=>{setSymbol(item.symbol);setSearch('')}} className={`shrink-0 rounded-lg border px-3 py-2 text-[10px] sm:text-xs ${symbol===item.symbol?'border-primary bg-primary/10 text-primary':'border-[#303b48] bg-surface text-neutral hover:text-white'}`}>{item.label}</button>)}</div><DirectionSummary bullish={bullish} sideways={sideways} bearish={bearish}/></div>{active.isError&&<p className="text-xs text-bearish">선택한 종목의 시장 데이터를 불러오지 못했습니다.</p>}</section>

    <section className="mt-3"><div className="card overflow-hidden p-2"><TradingViewAnalysisChart symbol={chartSymbol} interval={interval} market={active.data}/><div className="px-2 pb-1 pt-2 text-right text-[10px] text-neutral">Powered by TradingView Lightweight Charts</div></div></section>

  </main>

  function submitSearch(event:FormEvent){event.preventDefault();const target=normalizeSymbol(search);if(target){setSymbol(target);setSearch('')}}
}

const QUICK_SYMBOLS=[{label:'삼성전자',symbol:'KRX:005930'},{label:'카카오',symbol:'KRX:035720'},{label:'하이닉스',symbol:'KRX:000660'},{label:'비트코인',symbol:'BTCUSDT'},{label:'이더리움',symbol:'ETHUSDT'},{label:'리플',symbol:'XRPUSDT'},{label:'NVIDIA',symbol:'NASDAQ:NVDA'},{label:'Tesla',symbol:'NASDAQ:TSLA'}] as const;
function normalizeSymbol(raw:string){const input=raw.trim().toUpperCase().replace(/\s+/g,'');if(!input)return null;if(/^\d{6}$/.test(input))return`KRX:${input}`;if(input.includes(':'))return/^(KRX|NASDAQ|NYSE):[A-Z0-9.\-]+$/.test(input)?input:null;const compact=input.replace('/',''),asset=compact.replace(/(USDT|KRW)$/,'');if(['BTC','ETH','SOL','XRP'].includes(asset))return`${asset}USDT`;return/^[A-Z.\-]+$/.test(input)?`NASDAQ:${input}`:null}
function DirectionSummary({bullish,sideways,bearish}:{bullish:number|null;sideways:number|null;bearish:number|null}){return <div className="flex shrink-0 items-center gap-1 text-[9px] font-medium tabular-nums sm:gap-2 sm:text-[11px]"><span className="rounded bg-bullish/10 px-1.5 py-1 text-bullish">상승 {bullish??'—'}{bullish==null?'':'%'}</span><span className="rounded bg-white/5 px-1.5 py-1 text-neutral">횡보 {sideways??'—'}{sideways==null?'':'%'}</span><span className="rounded bg-bearish/10 px-1.5 py-1 text-bearish">하락 {bearish??'—'}{bearish==null?'':'%'}</span></div>}
