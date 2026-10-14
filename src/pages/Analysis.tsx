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
    <div className="mb-6"><div className="label">ASSET ANALYSIS</div><h1 className="mt-2 text-3xl font-semibold">{symbol.replace('USDT',' / USDT')}</h1></div>
    <div className="mb-4 flex flex-wrap gap-2">
      {['1m','5m','15m','1h','4h','1d'].map(value=><button key={value} onClick={()=>setInterval(value)} className={`rounded-lg px-3 py-2 text-xs ${value===interval?'bg-primary':'bg-surface text-neutral'}`}>{value}</button>)}
      <Toggle label="EMA 20" value={ema20} set={setEma20}/><Toggle label="EMA 50" value={ema50} set={setEma50}/><Toggle label="EMA 200" value={ema200} set={setEma200}/><Toggle label="Bollinger 20,2" value={bollinger} set={setBollinger}/>
    </div>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="card overflow-hidden p-3">{query.data?<MarketChart candles={query.data.candles} ema20={ema20} ema50={ema50} ema200={ema200} bollinger={bollinger}/>:<div className="grid h-[410px] place-items-center text-neutral">{query.isError?'시장 데이터 오류':'불러오는 중…'}</div>}</div>
      <aside className="space-y-4"><IndicatorDetails indicators={query.data?.indicators}/>{query.data&&<div className="card p-5"><div className="label">DATA BASIS</div><dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><Stat n="분석 기준" value={query.data.analysisTime}/><Stat n="캔들 수" value={`${query.data.dataPoints}개`}/><Stat n="데이터 공급자" value="Binance Spot"/><Stat n="갱신 시각" value={new Intl.DateTimeFormat('ko-KR',{dateStyle:'short',timeStyle:'medium'}).format(new Date(query.data.updatedAt))}/></dl></div>}<div className="card p-5"><div className="label">PROBABILITY</div><p className="mt-3 text-sm leading-6 text-neutral">검증·보정된 모델이 배포되기 전까지 수치형 확률을 제공하지 않습니다.</p></div></aside>
    </div>
  </main>;
}

function IndicatorDetails({indicators}:{indicators:IndicatorSnapshot|undefined}){
  if(!indicators)return <div className="card p-5"><div className="label">INDICATORS</div><p className="mt-4 text-sm text-neutral">실제 캔들 데이터를 불러오는 중입니다.</p></div>;
  const macdStatus=indicators.macd!=null&&indicators.signal!=null?(indicators.macd>=indicators.signal?'상승 우위':'하락 우위'):'데이터 부족';
  const emaStatus=indicators.ema20!=null&&indicators.ema50!=null&&indicators.ema200!=null?(indicators.ema20>indicators.ema50&&indicators.ema50>indicators.ema200?'정배열':indicators.ema20<indicators.ema50&&indicators.ema50<indicators.ema200?'역배열':'혼조'):'데이터 부족';
  return <div className="card p-5"><div className="label">INDICATORS</div><dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><NumberStat n="RSI 14" value={indicators.rsi}/><Stat n="MACD 상태" value={macdStatus}/><NumberStat n="MACD" value={indicators.macd}/><NumberStat n="Signal 9" value={indicators.signal}/><NumberStat n="Histogram" value={indicators.macdHistogram}/><Stat n="EMA 배열" value={emaStatus}/><NumberStat n="EMA 20" value={indicators.ema20}/><NumberStat n="EMA 50" value={indicators.ema50}/><NumberStat n="EMA 200" value={indicators.ema200}/><NumberStat n="ATR 14" value={indicators.atr}/><NumberStat n="BB Upper" value={indicators.bollinger?.upper??null}/><NumberStat n="BB Middle" value={indicators.bollinger?.middle??null}/><NumberStat n="BB Lower" value={indicators.bollinger?.lower??null}/><NumberStat n="거래량 MA20" value={indicators.volumeMovingAverage}/><Stat n="거래량 변화" value={indicators.volumeChangePercent==null?'데이터 부족':`${indicators.volumeChangePercent>=0?'+':''}${indicators.volumeChangePercent.toFixed(2)}%`}/></dl></div>;
}

function Toggle({label,value,set}:{label:string;value:boolean;set:(value:boolean)=>void}){return <button onClick={()=>set(!value)} className={`rounded-lg border px-3 py-2 text-xs ${value?'border-primary text-primary':'border-[#303b48] text-neutral'}`}>{label}</button>}
function NumberStat({n,value}:{n:string;value:number|null}){return <Stat n={n} value={value==null?'데이터 부족':value.toFixed(2)}/>}
function Stat({n,value}:{n:string;value:string}){return <div className="min-w-0"><dt className="text-neutral">{n}</dt><dd className="mt-1 break-words font-medium tabular-nums">{value}</dd></div>}
