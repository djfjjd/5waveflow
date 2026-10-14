import {useQuery} from '@tanstack/react-query';
import {Search} from 'lucide-react';
import {type FormEvent,useEffect,useState} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import TradingViewAnalysisChart from '../components/TradingViewAnalysisChart';
import {getMarket} from '../lib/api';
import type {IndicatorSnapshot,MarketPayload} from '../types';

const analysisFrames=['1d','4h','1h','30m','15m'] as const;
const cryptoSymbols=new Set(['BTCUSDT','ETHUSDT','SOLUSDT','XRPUSDT']);

export default function Analysis(){
  const{symbol='BTCUSDT'}=useParams();
  const navigate=useNavigate();
  const hasQuantData=cryptoSymbols.has(symbol)||/^(KRX|NASDAQ|NYSE):[A-Z0-9.\-]+$/.test(symbol);
  const[interval,setInterval]=useState('1h');
  const[symbolSearch,setSymbolSearch]=useState(symbol);
  useEffect(()=>setSymbolSearch(symbol),[symbol]);
  const query=useQuery({queryKey:['market',symbol,interval],queryFn:()=>getMarket(symbol,interval),enabled:hasQuantData});
  const frameQuery=useQuery({queryKey:['market-multiframe',symbol],queryFn:async()=>{const results:(MarketPayload|undefined)[]=[];for(const frame of analysisFrames)results.push(await getMarket(symbol,frame).catch(()=>undefined));return results},staleTime:60_000,enabled:hasQuantData});
  const multiFrame=buildMultiFrame(frameQuery.data??[]);
  return <main className="mx-auto max-w-[1440px] px-4 pb-8 pt-2 md:px-8 md:pt-4">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap gap-2">{['15m','30m','1h','4h','1d','1w'].map(value=><button key={value} onClick={()=>setInterval(value)} className={`rounded-lg px-3 py-2 text-xs ${value===interval?'bg-primary':'bg-surface text-neutral'}`}>{value}</button>)}</div><SymbolSearch value={symbolSearch} setValue={setSymbolSearch} onSubmit={submitSymbol}/></div>
    {!hasQuantData&&<div className="mb-4 rounded-lg border border-[#f5b942]/30 bg-[#f5b942]/5 px-4 py-3 text-xs text-[#e9bd58]">TradingView 차트는 표시되지만 이 종목의 자체 OHLCV 분석 공급자는 아직 연결되지 않았습니다.</div>}

    <section className="card overflow-hidden p-2"><TradingViewAnalysisChart symbol={query.data?tradingViewSymbol(symbol,query.data.quoteCurrency):tradingViewRouteSymbol(symbol)} interval={interval}/><div className="px-2 pb-1 pt-2 text-right text-[10px] text-neutral">Official chart by TradingView</div></section>

    <section className="mt-5 grid grid-cols-3 gap-2 md:gap-5">
      <ElliottDetails market={query.data} multiFrame={multiFrame} unavailable={!hasQuantData}/>
      <WyckoffDetails market={query.data} unavailable={!hasQuantData}/>
      <IndicatorDetails indicators={query.data?.indicators} unavailable={!hasQuantData}/>
    </section>

    <section className="mt-5 grid gap-5 md:grid-cols-2">{query.data&&<DataBasis market={query.data}/>}<div className="card p-5"><div className="label">PROBABILITY</div><p className="mt-3 text-sm leading-6 text-neutral">검증·보정된 모델이 배포되기 전까지 수치형 확률을 제공하지 않습니다.</p></div></section>
  </main>;

  function submitSymbol(event:FormEvent){event.preventDefault();const input=symbolSearch.trim().toUpperCase().replace(/\s+/g,'');if(!input)return;const compact=input.replace('/','');const asset=compact.replace(/(USDT|KRW)$/,'');let target:string;if(['BTC','ETH','SOL','XRP'].includes(asset))target=`${asset}USDT`;else if(/^\d{6}$/.test(input))target=`KRX:${input}`;else if(input.includes(':'))target=input;else if(/^[A-Z.\-]+$/.test(input))target=`NASDAQ:${input}`;else return;navigate(`/analysis/${encodeURIComponent(target)}`)}
}

function ElliottDetails({market,multiFrame,unavailable}:{market:MarketPayload|undefined;multiFrame:MultiFrame;unavailable:boolean}){const elliott=market?.analysis.elliott,primary=elliott?.scenarios[0];return <div className="card min-w-0 p-2 md:p-5"><div className="label text-[8px] md:text-xs">ELLIOTT WAVE</div><p className="mt-2 break-words text-[9px] font-medium leading-3 md:mt-3 md:text-sm md:leading-5">{unavailable?'공급자 미연결':multiFrame.summary}</p><p className="mt-1 text-[8px] leading-3 text-neutral md:hidden">{unavailable?'분석 불가':'일·4H·1H·30M·15M'}</p><div className="hidden md:block"><p className="mt-2 text-xs leading-5 text-neutral">{unavailable?'이 종목의 OHLCV 공급자가 필요합니다.':elliott?.detail??'분석 데이터를 불러오는 중입니다.'}</p>{!unavailable&&<p className="mt-3 text-xs text-primary">다중 시간대: {multiFrame.details}</p>}{primary&&<dl className="mt-3 grid grid-cols-2 gap-3 text-xs"><Stat n="현재 차트" value={primary.label}/><Stat n="상태" value={statusLabel(elliott!.status)}/><Stat n="무효화" value={primary.invalidationPrice.toLocaleString('ko-KR')}/><Stat n="되돌림" value={primary.fibonacci.retracement==null?'—':`${(primary.fibonacci.retracement*100).toFixed(1)}%`}/></dl>}</div></div>}

function WyckoffDetails({market,unavailable}:{market:MarketPayload|undefined;unavailable:boolean}){const wyckoff=market?.analysis.wyckoff;const title=unavailable?'공급자 미연결':wyckoff?.phase?`Phase ${wyckoff.phase}`:'Trading Range';return <div className="card min-w-0 p-2 md:p-5"><div className="label text-[8px] md:text-xs">WYCKOFF</div><p className="mt-2 break-words text-[9px] font-medium leading-3 md:mt-3 md:text-sm md:leading-5">{title}{!unavailable&&` · ${wyckoff?.bias==='accumulation'?'매집':wyckoff?.bias==='distribution'?'분산':'불확실'}`}</p><div className="hidden md:block"><p className="mt-2 text-xs leading-5 text-neutral">{unavailable?'이 종목의 OHLCV 공급자가 필요합니다.':wyckoff?.detail??'분석 데이터를 불러오는 중입니다.'}</p>{wyckoff&&<dl className="mt-3 grid grid-cols-2 gap-3 text-xs"><Stat n="이벤트" value={wyckoff.events.map(event=>event.type).join(', ')||'없음'}/><Stat n="상태" value={statusLabel(wyckoff.status)}/><Stat n="지지" value={wyckoff.support?.toLocaleString('ko-KR')??'—'}/><Stat n="저항" value={wyckoff.resistance?.toLocaleString('ko-KR')??'—'}/></dl>}</div></div>}

function IndicatorDetails({indicators,unavailable}:{indicators:IndicatorSnapshot|undefined;unavailable:boolean}){const macd=indicators?.macd!=null&&indicators.signal!=null?(indicators.macd>=indicators.signal?'상승 우위':'하락 우위'):'데이터 부족';const ema=indicators?.ema20!=null&&indicators.ema50!=null&&indicators.ema200!=null?(indicators.ema20>indicators.ema50&&indicators.ema50>indicators.ema200?'정배열':indicators.ema20<indicators.ema50&&indicators.ema50<indicators.ema200?'역배열':'혼조'):'데이터 부족';return <div className="card min-w-0 p-2 md:p-5"><div className="label text-[8px] md:text-xs">INDICATORS</div><p className="mt-2 break-words text-[9px] font-medium leading-3 md:mt-3 md:text-sm md:leading-5">{unavailable?'공급자 미연결':`RSI ${indicators?.rsi?.toFixed(1)??'—'} · ${macd}`}</p>{indicators&&<dl className="mt-4 hidden grid-cols-2 gap-4 text-sm md:grid"><NumberStat n="MACD" value={indicators.macd}/><NumberStat n="Signal 9" value={indicators.signal}/><NumberStat n="Histogram" value={indicators.macdHistogram}/><Stat n="EMA 배열" value={ema}/><NumberStat n="EMA 20" value={indicators.ema20}/><NumberStat n="EMA 50" value={indicators.ema50}/><NumberStat n="EMA 200" value={indicators.ema200}/><NumberStat n="ATR 14" value={indicators.atr}/><NumberStat n="BB Upper" value={indicators.bollinger?.upper??null}/><NumberStat n="BB Middle" value={indicators.bollinger?.middle??null}/><NumberStat n="BB Lower" value={indicators.bollinger?.lower??null}/><NumberStat n="거래량 MA20" value={indicators.volumeMovingAverage}/></dl>}</div>}

function DataBasis({market}:{market:MarketPayload}){return <div className="card p-5"><div className="label">DATA BASIS</div><dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><Stat n="분석 기준" value={market.analysisTime}/><Stat n="확정 캔들" value={`${market.dataPoints}개`}/><Stat n="데이터 공급자" value={market.provider}/><Stat n="데이터 상태" value={market.dataStatus==='fresh'?'정상':'오래된 데이터'}/><Stat n="마지막 확정" value={new Intl.DateTimeFormat('ko-KR',{dateStyle:'short',timeStyle:'short'}).format(new Date(market.dataTimestamp))}/><Stat n="현재 캔들" value={market.currentCandleComplete?'확정':'진행 중 제외'}/></dl></div>}

type MultiFrame={summary:string;details:string};
function buildMultiFrame(markets:(MarketPayload|undefined)[]):MultiFrame{let bullish=0,bearish=0,available=0;const details=analysisFrames.map((frame,index)=>{const scenario=markets[index]?.analysis.elliott.scenarios[0];if(!scenario)return`${frame}: 판정 불가`;available++;if(scenario.direction==='bullish')bullish++;else bearish++;return`${frame}: ${scenario.direction==='bullish'?'상승':'하락'} ${scenario.pattern}`});const direction=!available?'다중 시간대 판정 불가':bullish===bearish?'상승·하락 혼조':bullish>bearish?'다중 시간대 상승 우세':'다중 시간대 하락 우세';return{summary:`${direction} (${available}/${analysisFrames.length})`,details:details.join(' · ')}}
function SymbolSearch({value,setValue,onSubmit}:{value:string;setValue:(value:string)=>void;onSubmit:(event:FormEvent)=>void}){return <form onSubmit={onSubmit} className="flex w-full max-w-sm items-center rounded-lg border border-[#303b48] bg-surface px-3 focus-within:border-primary"><Search size={16} className="shrink-0 text-neutral"/><input aria-label="심볼 검색" list="analysis-symbols" value={value} onChange={event=>setValue(event.target.value)} placeholder="005930, NASDAQ:AAPL, BTC…" className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm text-white outline-none"/><datalist id="analysis-symbols"><option value="005930">Samsung Electronics</option><option value="035720">Kakao</option><option value="NASDAQ:AAPL">Apple</option><option value="NASDAQ:NVDA">NVIDIA</option><option value="NASDAQ:TSLA">Tesla</option><option value="BTC">Bitcoin</option><option value="ETH">Ethereum</option><option value="SOL">Solana</option><option value="XRP">XRP</option></datalist><button type="submit" className="text-[10px] font-medium text-primary">검색</button></form>}
function statusLabel(status:'confirmed'|'developing'|'unavailable'){return status==='confirmed'?'확정':status==='developing'?'진행 중':'판정 불가'}
function tradingViewSymbol(symbol:string,_quoteCurrency:'USDT'|'KRW'|'USD'){if(symbol.includes(':'))return symbol;return`BINANCE:${symbol}`}
function tradingViewRouteSymbol(symbol:string){if(cryptoSymbols.has(symbol))return`BINANCE:${symbol}`;return symbol.includes(':')?symbol:`NASDAQ:${symbol}`}
function NumberStat({n,value}:{n:string;value:number|null}){return <Stat n={n} value={value==null?'데이터 부족':value.toFixed(2)}/>}
function Stat({n,value}:{n:string;value:string}){return <div className="min-w-0"><dt className="text-neutral">{n}</dt><dd className="mt-1 break-words font-medium tabular-nums">{value}</dd></div>}
