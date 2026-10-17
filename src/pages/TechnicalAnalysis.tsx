import {BookOpen,Search} from 'lucide-react';
import {useEffect,useMemo,useState} from 'react';
import {glossaryDirection,TECHNICAL_GLOSSARY} from '../lib/technicalGlossary';

const groups=['전체','Wyckoff 이벤트','Wyckoff Phase','기술적 지표','Elliott Wave'] as const;

export default function TechnicalAnalysis(){
  const[query,setQuery]=useState(''),[group,setGroup]=useState<(typeof groups)[number]>('전체');
  const items=useMemo(()=>{const needle=query.trim().toLowerCase();return TECHNICAL_GLOSSARY.filter(item=>(group==='전체'||item.group===group)&&(!needle||`${item.term} ${item.fullName} ${item.summary}`.toLowerCase().includes(needle)))},[query,group]);
  useEffect(()=>{if(location.hash)requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView({behavior:'smooth',block:'start'}))},[]);
  return <main className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-10">
    <section className="rounded-2xl border border-[#26303d] bg-gradient-to-br from-primary/10 via-surface to-background p-5 md:p-8"><div className="flex items-center gap-2 text-primary"><BookOpen size={18}/><span className="label">TECHNICAL ANALYSIS GUIDE</span></div><h1 className="mt-3 text-2xl font-semibold md:text-4xl">기술적 분석 용어 설명</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-neutral">차트에 표시되는 SOW, SC, Upthrust 등의 의미와 확인 조건을 설명합니다. 카드의 상승·횡보·하락 수치는 해당 패턴의 일반적인 방향 영향 분포이며 실제 종목의 예측 성공확률이 아닙니다.</p></section>
    <section className="sticky top-16 z-30 mt-4 rounded-xl border border-[#26303d] bg-background/95 p-3 backdrop-blur"><label className="flex items-center rounded-lg border border-[#354252] bg-surface px-3"><Search size={16} className="text-neutral"/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="SOW, Spring, RSI 검색" className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none"/></label><div className="mt-2 flex gap-2 overflow-x-auto">{groups.map(value=><button key={value} onClick={()=>setGroup(value)} className={`shrink-0 rounded-lg px-3 py-2 text-xs ${group===value?'bg-primary text-white':'bg-surface text-neutral'}`}>{value}</button>)}</div></section>
    <div className="mt-5 grid gap-3 md:grid-cols-2">{items.map(item=>{const impact=glossaryDirection(item.id);return <article id={item.id} key={item.id} className="scroll-mt-44 rounded-xl border border-[#26303d] bg-surface/70 p-4 md:p-5"><div className="flex items-start justify-between gap-3"><div><div className="text-lg font-semibold text-white">{item.term}</div><div className="mt-1 text-xs text-primary">{item.fullName}</div><div className="mt-1 text-[10px] text-neutral">{item.group}</div></div><DirectionImpact impact={impact}/></div><p className="mt-4 text-sm leading-6 text-neutral">{item.summary}</p><dl className="mt-4 space-y-3 text-xs leading-5"><Detail name="해석" value={item.signal}/><Detail name="확인" value={item.confirmation}/><Detail name="주의" value={item.caution} caution/></dl></article>})}</div>
    {!items.length&&<div className="py-16 text-center text-sm text-neutral">일치하는 설명이 없습니다.</div>}
    <p className="mt-6 rounded-xl border border-warning/30 bg-warning/5 p-4 text-xs leading-5 text-warning">방향 영향 분포는 용어의 성격을 비교하기 위한 교육용 기준값입니다. 실시간 시장 데이터로 산출한 종목별 확률이나 검증된 성공률이 아닙니다. 한 가지 이벤트만으로 매매 결정을 내리지 말고 확정 캔들·상위 시간대·무효화 조건을 함께 확인하세요.</p>
  </main>
}

function Detail({name,value,caution=false}:{name:string;value:string;caution?:boolean}){return <div><dt className={caution?'text-warning':'text-white'}>{name}</dt><dd className="mt-0.5 text-neutral">{value}</dd></div>}
function DirectionImpact({impact}:{impact:ReturnType<typeof glossaryDirection>}){return <div className="shrink-0 text-right"><div className="flex gap-1 text-[9px] font-medium tabular-nums sm:text-[10px]"><span className="rounded bg-bullish/10 px-1.5 py-1 text-bullish">상승 {impact.bullish}%</span><span className="rounded bg-white/5 px-1.5 py-1 text-neutral">횡보 {impact.sideways}%</span><span className="rounded bg-bearish/10 px-1.5 py-1 text-bearish">하락 {impact.bearish}%</span></div><div className="mt-1 max-w-[230px] text-[9px] leading-4 text-neutral">{impact.basis}</div></div>}
