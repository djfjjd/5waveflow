import {useQueries} from '@tanstack/react-query';
import {useEffect,useState,type ReactNode} from 'react';
import {CheckCircle2,Database,XCircle} from 'lucide-react';
import {MARKET_SYMBOLS,type MarketSymbol} from '@5waveflow/market-data';
import {getPerformance} from '../lib/api';
import {PERFORMANCE_INTERVALS,type Direction,type PerformanceInterval,type PerformancePayload,type PerformanceResult} from '../lib/performance';

const intervalLabels:Record<PerformanceInterval,string>={'15m':'15분','1h':'1시간','4h':'4시간','1d':'1일'};
const directionLabels:Record<Direction,string>={bullish:'상승',sideways:'횡보',bearish:'하락'};
const symbolLabels:Record<MarketSymbol,string>={'KRX:005930':'삼성전자','KRX:035720':'카카오','KRX:000660':'SK하이닉스',BTCUSDT:'비트코인/USDT',BTCKRW:'비트코인/원',ETHUSDT:'이더리움',XRPUSDT:'리플','NASDAQ:NVDA':'NVIDIA','NASDAQ:TSLA':'Tesla'};

export default function Performance(){
  const[symbol,setSymbol]=useState<MarketSymbol>('BTCUSDT'),[selected,setSelected]=useState<PerformanceResult>();
  const queries=useQueries({queries:PERFORMANCE_INTERVALS.map(interval=>({queryKey:['performance',symbol,interval],queryFn:()=>getPerformance(symbol,interval),staleTime:60_000,refetchInterval:300_000,retry:1}))});
  useEffect(()=>setSelected(undefined),[symbol]);
  return <main className="theme-page mx-auto max-w-[1440px] px-4 py-6 md:px-8">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h1 className="text-2xl font-semibold md:text-3xl">백테스트 기록</h1><label className="flex items-center gap-2 text-sm text-neutral"><span className="shrink-0">종목</span><select value={symbol} onChange={event=>setSymbol(event.target.value as MarketSymbol)} className="min-w-48 rounded-lg border border-[#354252] bg-background px-3 py-2.5 text-sm text-white">{MARKET_SYMBOLS.map(value=><option key={value} value={value}>{symbolLabels[value]}</option>)}</select></label></div>
    <div className="mt-5 overflow-x-auto pb-2"><section className="grid min-w-[1080px] grid-cols-4 gap-3">{PERFORMANCE_INTERVALS.map((interval,index)=><TimeframeColumn key={interval} interval={interval} payload={queries[index].data} loading={queries[index].isLoading} error={queries[index].error} selected={selected} onSelect={setSelected}/>)}</section></div>
    <ResultDetails result={selected}/>
  </main>
}

function TimeframeColumn({interval,payload,loading,error,selected,onSelect}:{interval:PerformanceInterval;payload:PerformancePayload|undefined;loading:boolean;error:Error|null;selected:PerformanceResult|undefined;onSelect:(result:PerformanceResult)=>void}){
  if(loading)return <ColumnShell interval={interval}><ColumnEmpty text="계산 중…"/></ColumnShell>;
  if(error)return <ColumnShell interval={interval}><ColumnEmpty text={`API 오류 · ${error.message}`}/></ColumnShell>;
  if(!payload?.modelAvailable)return <ColumnShell interval={interval}><ColumnEmpty text={payload?.emptyReason||'백테스트 불가'}/></ColumnShell>;
  const summary=payload.summary,results=payload.results??[],slots:Array<PerformanceResult|undefined>=[...Array(Math.max(0,30-results.length)).fill(undefined),...results.slice(-30)];
  return <ColumnShell interval={interval}><div className="grid grid-cols-2 gap-2"><MiniMetric label="검증 완료" value={`${summary.completed}/${summary.targetCount}`}/><MiniMetric label="전체 승률" value={percent(summary.winRate)}/><MiniMetric label="적중" value={`${summary.hits}`} tone="bullish"/><MiniMetric label="실패" value={`${summary.misses}`} tone="bearish"/><MiniMetric label="상승 승률" value={percent(summary.byDirection.bullish.winRate)}/><MiniMetric label="횡보 승률" value={percent(summary.byDirection.sideways.winRate)}/><MiniMetric label="하락 승률" value={percent(summary.byDirection.bearish.winRate)}/><MiniMetric label="Score" value={summary.brierScore==null?'—':summary.brierScore.toFixed(4)}/></div><div className="mt-3 grid grid-cols-10 gap-1">{slots.map((result,index)=><button key={result?.id??`${interval}-empty-${index}`} type="button" disabled={!result} onClick={()=>result&&onSelect(result)} aria-label={result?`${intervalLabels[interval]} ${index+1}번째 검증 ${result.hit?'적중':'실패'}`:`${intervalLabels[interval]} ${index+1}번째 데이터 없음`} className={`aspect-square rounded border transition ${!result?'cursor-default border-[#354252] bg-transparent':result.hit?'border-bullish/40 bg-bullish/25 hover:bg-bullish/40':'border-bearish/40 bg-bearish/25 hover:bg-bearish/40'} ${selected?.id===result?.id?'ring-2 ring-primary':''}`}>{result?<span className={`text-[10px] ${result.hit?'text-bullish':'text-bearish'}`}>{result.hit?'✓':'×'}</span>:<span className="text-neutral/40">·</span>}</button>)}</div></ColumnShell>;
}

function ColumnShell({interval,children}:{interval:PerformanceInterval;children:ReactNode}){return <article className="rounded-xl border border-[#26303d] bg-surface/70 p-3"><h2 className="mb-3 text-center text-base font-semibold">{intervalLabels[interval]}</h2>{children}</article>}
function ColumnEmpty({text}:{text:string}){return <div className="flex min-h-72 flex-col items-center justify-center px-3 text-center"><Database size={22} className="text-neutral"/><p className="mt-3 text-xs leading-5 text-neutral">{text}</p></div>}
function MiniMetric({label,value,tone}:{label:string;value:string;tone?:'bullish'|'bearish'}){return <div className="rounded-lg border border-[#26303d] bg-background/40 p-2"><div className="text-[9px] text-neutral">{label}</div><div className={`mt-1 text-sm font-semibold tabular-nums ${tone==='bullish'?'text-bullish':tone==='bearish'?'text-bearish':''}`}>{value}</div></div>}
function ResultDetails({result}:{result:PerformanceResult|undefined}){if(!result)return <div className="mt-4 rounded-xl border border-dashed border-[#354252] p-5 text-center text-xs text-neutral">각 시간봉의 결과를 선택하면 상세 정보가 표시됩니다.</div>;return <section className="mt-4 rounded-xl border border-[#26303d] bg-surface/70 p-5"><div className="flex items-center gap-2">{result.hit?<CheckCircle2 className="text-bullish"/>:<XCircle className="text-bearish"/>}<div><div className="label">{intervalLabels[result.interval]} RESULT</div><h2 className="text-base font-semibold">{result.hit?'적중':'실패'} · {directionLabels[result.predictedDirection]} 예측</h2></div></div><dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 text-xs md:grid-cols-4"><Detail label="예측 시각" value={formatTime(result.predictionTime)}/><Detail label="예측 당시 가격" value={formatPrice(result.predictionPrice)}/><Detail label="상승·횡보·하락" value={`${result.scores.bullish}% · ${result.scores.sideways}% · ${result.scores.bearish}%`}/><Detail label="예측 방향" value={directionLabels[result.predictedDirection]}/><Detail label="실제 방향" value={directionLabels[result.actualDirection]}/><Detail label="실제 수익률" value={`${result.returnPercent>=0?'+':''}${result.returnPercent.toFixed(3)}%`}/><Detail label="적중 여부" value={result.hit?'적중':'실패'}/><Detail label="모델 버전" value={result.modelVersion}/></dl></section>}
function Detail({label,value}:{label:string;value:string}){return <div><dt className="text-neutral">{label}</dt><dd className="mt-1 break-words font-medium tabular-nums">{value}</dd></div>}
function percent(value:number|null|undefined){return value==null?'—':`${value.toFixed(1)}%`}
function formatPrice(value:number){return value.toLocaleString(undefined,{maximumFractionDigits:2})}
function formatTime(value:string){return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'2-digit',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value))}
