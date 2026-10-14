import {useQuery} from '@tanstack/react-query';
import {useState} from 'react';
import {useParams} from 'react-router-dom';
import MarketChart from '../components/MarketChart';
import {getMarket} from '../lib/api';
import type {IndicatorSnapshot,MarketPayload} from '../types';

const analysisFrames=['1d','4h','1h','30m','15m'] as const;

export default function Analysis(){
  const{symbol='BTCUSDT'}=useParams();
  const[interval,setInterval]=useState('1h');
  const[ema20,setEma20]=useState(true),[ema50,setEma50]=useState(true),[ema200,setEma200]=useState(false),[bollinger,setBollinger]=useState(false);
  const query=useQuery({queryKey:['market',symbol,interval],queryFn:()=>getMarket(symbol,interval)});
  const frameQuery=useQuery({queryKey:['market-multiframe',symbol],queryFn:async()=>{const results:(MarketPayload|undefined)[]=[];for(const frame of analysisFrames)results.push(await getMarket(symbol,frame).catch(()=>undefined));return results},staleTime:60_000});
  const multiFrame=buildMultiFrame(frameQuery.data??[]);
  return <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-8">
    <div className="mb-6"><div className="label">ASSET ANALYSIS</div><h1 className="mt-2 text-3xl font-semibold">{symbol.replace('USDT',` / ${query.data?.quoteCurrency??'USDT'}`)}</h1></div>
    <div className="mb-4 flex flex-wrap gap-2">{['15m','30m','1h','4h','1d','1w'].map(value=><button key={value} onClick={()=>setInterval(value)} className={`rounded-lg px-3 py-2 text-xs ${value===interval?'bg-primary':'bg-surface text-neutral'}`}>{value}</button>)}<Toggle label="EMA 20" value={ema20} set={setEma20}/><Toggle label="EMA 50" value={ema50} set={setEma50}/><Toggle label="EMA 200" value={ema200} set={setEma200}/><Toggle label="Bollinger 20,2" value={bollinger} set={setBollinger}/></div>

    <section className="card overflow-hidden p-3">{query.data?<MarketChart candles={query.data.candles} ema20={ema20} ema50={ema50} ema200={ema200} bollinger={bollinger}/>:<div className="grid h-[410px] place-items-center text-neutral">{query.isError?'시장 데이터 오류':'불러오는 중…'}</div>}</section>

    <section className="mt-5 grid grid-cols-3 gap-2 md:gap-5">
      <ElliottDetails market={query.data} multiFrame={multiFrame}/>
      <WyckoffDetails market={query.data}/>
      <IndicatorDetails indicators={query.data?.indicators}/>
    </section>

    <section className="mt-5 grid gap-5 md:grid-cols-2">{query.data&&<DataBasis market={query.data}/>}<div className="card p-5"><div className="label">PROBABILITY</div><p className="mt-3 text-sm leading-6 text-neutral">검증·보정된 모델이 배포되기 전까지 수치형 확률을 제공하지 않습니다.</p></div></section>
  </main>;
}

function ElliottDetails({market,multiFrame}:{market:MarketPayload|undefined;multiFrame:MultiFrame}){const elliott=market?.analysis.elliott,primary=elliott?.scenarios[0];return <div className="card min-w-0 p-2 md:p-5"><div className="label text-[8px] md:text-xs">ELLIOTT WAVE</div><p className="mt-2 break-words text-[9px] font-medium leading-3 md:mt-3 md:text-sm md:leading-5">{multiFrame.summary}</p><p className="mt-1 text-[8px] leading-3 text-neutral md:hidden">일·4H·1H·30M·15M</p><div className="hidden md:block"><p className="mt-2 text-xs leading-5 text-neutral">{elliott?.detail??'분석 데이터를 불러오는 중입니다.'}</p><p className="mt-3 text-xs text-primary">다중 시간대: {multiFrame.details}</p>{primary&&<dl className="mt-3 grid grid-cols-2 gap-3 text-xs"><Stat n="현재 차트" value={primary.label}/><Stat n="상태" value={statusLabel(elliott!.status)}/><Stat n="무효화" value={primary.invalidationPrice.toLocaleString('ko-KR')}/><Stat n="되돌림" value={primary.fibonacci.retracement==null?'—':`${(primary.fibonacci.retracement*100).toFixed(1)}%`}/></dl>}</div></div>}

function WyckoffDetails({market}:{market:MarketPayload|undefined}){const wyckoff=market?.analysis.wyckoff;const title=wyckoff?.phase?`Phase ${wyckoff.phase}`:'판정 불가';return <div className="card min-w-0 p-2 md:p-5"><div className="label text-[8px] md:text-xs">WYCKOFF</div><p className="mt-2 break-words text-[9px] font-medium leading-3 md:mt-3 md:text-sm md:leading-5">{title} · {wyckoff?.bias==='accumulation'?'매집':wyckoff?.bias==='distribution'?'분산':'불확실'}</p><div className="hidden md:block"><p className="mt-2 text-xs leading-5 text-neutral">{wyckoff?.detail??'분석 데이터를 불러오는 중입니다.'}</p>{wyckoff&&<dl className="mt-3 grid grid-cols-2 gap-3 text-xs"><Stat n="이벤트" value={wyckoff.events.map(event=>event.type).join(', ')||'없음'}/><Stat n="상태" value={statusLabel(wyckoff.status)}/><Stat n="지지" value={wyckoff.support?.toLocaleString('ko-KR')??'—'}/><Stat n="저항" value={wyckoff.resistance?.toLocaleString('ko-KR')??'—'}/></dl>}</div></div>}

function IndicatorDetails({indicators}:{indicators:IndicatorSnapshot|undefined}){const macd=indicators?.macd!=null&&indicators.signal!=null?(indicators.macd>=indicators.signal?'상승 우위':'하락 우위'):'데이터 부족';const ema=indicators?.ema20!=null&&indicators.ema50!=null&&indicators.ema200!=null?(indicators.ema20>indicators.ema50&&indicators.ema50>indicators.ema200?'정배열':indicators.ema20<indicators.ema50&&indicators.ema50<indicators.ema200?'역배열':'혼조'):'데이터 부족';return <div className="card min-w-0 p-2 md:p-5"><div className="label text-[8px] md:text-xs">INDICATORS</div><p className="mt-2 break-words text-[9px] font-medium leading-3 md:mt-3 md:text-sm md:leading-5">RSI {indicators?.rsi?.toFixed(1)??'—'} · {macd}</p>{indicators&&<dl className="mt-4 hidden grid-cols-2 gap-4 text-sm md:grid"><NumberStat n="MACD" value={indicators.macd}/><NumberStat n="Signal 9" value={indicators.signal}/><NumberStat n="Histogram" value={indicators.macdHistogram}/><Stat n="EMA 배열" value={ema}/><NumberStat n="EMA 20" value={indicators.ema20}/><NumberStat n="EMA 50" value={indicators.ema50}/><NumberStat n="EMA 200" value={indicators.ema200}/><NumberStat n="ATR 14" value={indicators.atr}/><NumberStat n="BB Upper" value={indicators.bollinger?.upper??null}/><NumberStat n="BB Middle" value={indicators.bollinger?.middle??null}/><NumberStat n="BB Lower" value={indicators.bollinger?.lower??null}/><NumberStat n="거래량 MA20" value={indicators.volumeMovingAverage}/></dl>}</div>}

function DataBasis({market}:{market:MarketPayload}){return <div className="card p-5"><div className="label">DATA BASIS</div><dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><Stat n="분석 기준" value={market.analysisTime}/><Stat n="확정 캔들" value={`${market.dataPoints}개`}/><Stat n="데이터 공급자" value={market.provider}/><Stat n="데이터 상태" value={market.dataStatus==='fresh'?'정상':'오래된 데이터'}/><Stat n="마지막 확정" value={new Intl.DateTimeFormat('ko-KR',{dateStyle:'short',timeStyle:'short'}).format(new Date(market.dataTimestamp))}/><Stat n="현재 캔들" value={market.currentCandleComplete?'확정':'진행 중 제외'}/></dl></div>}

type MultiFrame={summary:string;details:string};
function buildMultiFrame(markets:(MarketPayload|undefined)[]):MultiFrame{let bullish=0,bearish=0,available=0;const details=analysisFrames.map((frame,index)=>{const scenario=markets[index]?.analysis.elliott.scenarios[0];if(!scenario)return`${frame}: 판정 불가`;available++;if(scenario.direction==='bullish')bullish++;else bearish++;return`${frame}: ${scenario.direction==='bullish'?'상승':'하락'} ${scenario.pattern}`});const direction=!available?'다중 시간대 판정 불가':bullish===bearish?'상승·하락 혼조':bullish>bearish?'다중 시간대 상승 우세':'다중 시간대 하락 우세';return{summary:`${direction} (${available}/${analysisFrames.length})`,details:details.join(' · ')}}
function statusLabel(status:'confirmed'|'developing'|'unavailable'){return status==='confirmed'?'확정':status==='developing'?'진행 중':'판정 불가'}
function Toggle({label,value,set}:{label:string;value:boolean;set:(value:boolean)=>void}){return <button onClick={()=>set(!value)} className={`rounded-lg border px-3 py-2 text-xs ${value?'border-primary text-primary':'border-[#303b48] text-neutral'}`}>{label}</button>}
function NumberStat({n,value}:{n:string;value:number|null}){return <Stat n={n} value={value==null?'데이터 부족':value.toFixed(2)}/>}
function Stat({n,value}:{n:string;value:string}){return <div className="min-w-0"><dt className="text-neutral">{n}</dt><dd className="mt-1 break-words font-medium tabular-nums">{value}</dd></div>}
