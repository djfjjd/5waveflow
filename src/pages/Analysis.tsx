import {useQuery} from '@tanstack/react-query';
import {useState} from 'react';
import {useParams} from 'react-router-dom';
import MarketChart from '../components/MarketChart';
import {getMarket} from '../lib/api';
import type {IndicatorSnapshot} from '../types';

export default function Analysis(){
  const{symbol='BTCUSDT'}=useParams();
  const[interval,setInterval]=useState('1h');
  const[ema20,setEma20]=useState(true);
  const[ema50,setEma50]=useState(true);
  const[ema200,setEma200]=useState(false);
  const[bollinger,setBollinger]=useState(false);
  const query=useQuery({queryKey:['market',symbol,interval],queryFn:()=>getMarket(symbol,interval)});
  return <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-8">
    <div className="mb-6"><div className="label">ASSET ANALYSIS</div><h1 className="mt-2 text-3xl font-semibold">{symbol.replace('USDT',` / ${query.data?.quoteCurrency??'USDT'}`)}</h1></div>
    <div className="mb-4 flex flex-wrap gap-2">
      {['15m','1h','4h','1d','1w'].map(value=><button key={value} onClick={()=>setInterval(value)} className={`rounded-lg px-3 py-2 text-xs ${value===interval?'bg-primary':'bg-surface text-neutral'}`}>{value}</button>)}
      <Toggle label="EMA 20" value={ema20} set={setEma20}/><Toggle label="EMA 50" value={ema50} set={setEma50}/><Toggle label="EMA 200" value={ema200} set={setEma200}/><Toggle label="Bollinger 20,2" value={bollinger} set={setBollinger}/>
    </div>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="card overflow-hidden p-3">{query.data?<MarketChart candles={query.data.candles} ema20={ema20} ema50={ema50} ema200={ema200} bollinger={bollinger}/>:<div className="grid h-[410px] place-items-center text-neutral">{query.isError?'시장 데이터 오류':'불러오는 중…'}</div>}</div>
      <aside className="space-y-4">{query.data&&<PatternDetails market={query.data}/>}<IndicatorDetails indicators={query.data?.indicators}/>{query.data&&<div className="card p-5"><div className="label">DATA BASIS</div><dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><Stat n="분석 기준" value={query.data.analysisTime}/><Stat n="확정 캔들" value={`${query.data.dataPoints}개`}/><Stat n="데이터 공급자" value={query.data.provider}/><Stat n="데이터 상태" value={query.data.dataStatus==='fresh'?'정상':'오래된 데이터'}/><Stat n="마지막 확정" value={new Intl.DateTimeFormat('ko-KR',{dateStyle:'short',timeStyle:'short'}).format(new Date(query.data.dataTimestamp))}/><Stat n="현재 캔들" value={query.data.currentCandleComplete?'확정':'진행 중 제외'}/><Stat n="갱신 시각" value={new Intl.DateTimeFormat('ko-KR',{dateStyle:'short',timeStyle:'medium'}).format(new Date(query.data.updatedAt))}/></dl></div>}<div className="card p-5"><div className="label">PROBABILITY</div><p className="mt-3 text-sm leading-6 text-neutral">검증·보정된 모델이 배포되기 전까지 수치형 확률을 제공하지 않습니다.</p></div></aside>
    </div>
  </main>;
}

function PatternDetails({market}:{market:Awaited<ReturnType<typeof getMarket>>}){const{elliott,wyckoff}=market.analysis;const primary=elliott.scenarios[0];return <><div className="card p-5"><div className="label">ELLIOTT WAVE</div><p className="mt-3 text-sm font-medium">{primary?.label??'판정 불가'} · {statusLabel(elliott.status)}</p><p className="mt-2 text-xs leading-5 text-neutral">{elliott.detail}</p>{primary&&<dl className="mt-3 grid grid-cols-2 gap-3 text-xs"><Stat n="방향" value={primary.direction==='bullish'?'상승':'하락'}/><Stat n="무효화" value={primary.invalidationPrice.toLocaleString('ko-KR')}/><Stat n="되돌림" value={primary.fibonacci.retracement==null?'—':`${(primary.fibonacci.retracement*100).toFixed(1)}%`}/><Stat n="확장" value={primary.fibonacci.extension==null?'—':primary.fibonacci.extension.toFixed(2)}/></dl>}</div><div className="card p-5"><div className="label">WYCKOFF</div><p className="mt-3 text-sm font-medium">{wyckoff.phase?`Phase ${wyckoff.phase}`:'판정 불가'} · {wyckoff.bias==='accumulation'?'매집':wyckoff.bias==='distribution'?'분산':'불확실'}</p><p className="mt-2 text-xs leading-5 text-neutral">{wyckoff.detail}</p><dl className="mt-3 grid grid-cols-2 gap-3 text-xs"><Stat n="이벤트" value={wyckoff.events.map(event=>event.type).join(', ')||'없음'}/><Stat n="상태" value={statusLabel(wyckoff.status)}/><Stat n="지지" value={wyckoff.support?.toLocaleString('ko-KR')??'—'}/><Stat n="저항" value={wyckoff.resistance?.toLocaleString('ko-KR')??'—'}/></dl></div></>}
function statusLabel(status:'confirmed'|'developing'|'unavailable'){return status==='confirmed'?'확정':status==='developing'?'진행 중':'판정 불가'}

function IndicatorDetails({indicators}:{indicators:IndicatorSnapshot|undefined}){
  if(!indicators)return <div className="card p-5"><div className="label">INDICATORS</div><p className="mt-4 text-sm text-neutral">실제 캔들 데이터를 불러오는 중입니다.</p></div>;
  const macdStatus=indicators.macd!=null&&indicators.signal!=null?(indicators.macd>=indicators.signal?'상승 우위':'하락 우위'):'데이터 부족';
  const emaStatus=indicators.ema20!=null&&indicators.ema50!=null&&indicators.ema200!=null?(indicators.ema20>indicators.ema50&&indicators.ema50>indicators.ema200?'정배열':indicators.ema20<indicators.ema50&&indicators.ema50<indicators.ema200?'역배열':'혼조'):'데이터 부족';
  return <div className="card p-5"><div className="label">INDICATORS</div><dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><NumberStat n="RSI 14" value={indicators.rsi}/><Stat n="MACD 상태" value={macdStatus}/><NumberStat n="MACD" value={indicators.macd}/><NumberStat n="Signal 9" value={indicators.signal}/><NumberStat n="Histogram" value={indicators.macdHistogram}/><Stat n="EMA 배열" value={emaStatus}/><NumberStat n="EMA 20" value={indicators.ema20}/><NumberStat n="EMA 50" value={indicators.ema50}/><NumberStat n="EMA 200" value={indicators.ema200}/><NumberStat n="ATR 14" value={indicators.atr}/><NumberStat n="BB Upper" value={indicators.bollinger?.upper??null}/><NumberStat n="BB Middle" value={indicators.bollinger?.middle??null}/><NumberStat n="BB Lower" value={indicators.bollinger?.lower??null}/><NumberStat n="거래량 MA20" value={indicators.volumeMovingAverage}/><Stat n="거래량 변화" value={indicators.volumeChangePercent==null?'데이터 부족':`${indicators.volumeChangePercent>=0?'+':''}${indicators.volumeChangePercent.toFixed(2)}%`}/></dl></div>;
}

function Toggle({label,value,set}:{label:string;value:boolean;set:(value:boolean)=>void}){return <button onClick={()=>set(!value)} className={`rounded-lg border px-3 py-2 text-xs ${value?'border-primary text-primary':'border-[#303b48] text-neutral'}`}>{label}</button>}
function NumberStat({n,value}:{n:string;value:number|null}){return <Stat n={n} value={value==null?'데이터 부족':value.toFixed(2)}/>}
function Stat({n,value}:{n:string;value:string}){return <div className="min-w-0"><dt className="text-neutral">{n}</dt><dd className="mt-1 break-words font-medium tabular-nums">{value}</dd></div>}
