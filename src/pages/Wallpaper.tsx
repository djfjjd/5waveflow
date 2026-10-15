import {MARKET_INTERVALS,MARKET_SYMBOLS,marketApiRequest,type MarketInterval,type MarketSymbol} from '@5waveflow/market-data';
import {WALLPAPER_PRESETS,type WallpaperPresetId,type WallpaperTheme} from '@5waveflow/wallpaper';
import {useQuery} from '@tanstack/react-query';
import {useState} from 'react';
import WallpaperChart from '../components/WallpaperChart';
import {getMarket} from '../lib/api';

export default function Wallpaper(){
  const[symbol,setSymbol]=useState<MarketSymbol>('BTCUSDT'),[interval,setInterval]=useState<MarketInterval>('15m'),[theme,setTheme]=useState<WallpaperTheme>('dark'),[presetId,setPresetId]=useState<WallpaperPresetId>('professional');
  const preset=WALLPAPER_PRESETS.find(item=>item.id===presetId)!;
  const request=marketApiRequest({symbol,interval});
  const query=useQuery({queryKey:['wallpaper',symbol,interval],queryFn:()=>getMarket(request.symbol,request.interval,request.market),refetchInterval:60_000,staleTime:20_000});
  const market=query.data,connected=Boolean(market)&&market?.dataStatus==='fresh';
  return <main className="mx-auto max-w-[1440px] px-4 py-6 md:px-8">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><div className="label">5WAVEFLOW LIVE</div><h1 className="mt-1 text-2xl font-semibold">라이브 월페이퍼</h1></div><div className={`rounded-full border px-3 py-1 text-xs ${connected?'border-bullish/40 text-bullish':query.isError?'border-bearish/40 text-bearish':'border-[#354252] text-neutral'}`}>{connected?'실제 데이터 연결됨':query.isError?'연결 오류':'연결 중'}</div></div>
    <section className="mb-4 grid gap-3 rounded-xl border border-[#26303d] bg-surface/70 p-3 md:grid-cols-4">
      <Control label="종목"><select value={symbol} onChange={event=>setSymbol(event.target.value as MarketSymbol)}>{MARKET_SYMBOLS.map(value=><option key={value}>{value}</option>)}</select></Control>
      <Control label="시간봉"><select value={interval} onChange={event=>setInterval(event.target.value as MarketInterval)}>{MARKET_INTERVALS.map(value=><option key={value}>{value}</option>)}</select></Control>
      <Control label="프리셋"><select value={presetId} onChange={event=>setPresetId(event.target.value as WallpaperPresetId)}>{WALLPAPER_PRESETS.map(value=><option key={value.id} value={value.id}>{value.name}</option>)}</select></Control>
      <Control label="테마"><select value={theme} onChange={event=>setTheme(event.target.value as WallpaperTheme)}><option value="dark">Dark</option><option value="light">Light</option></select></Control>
    </section>
    {symbol==='BTCKRW'&&<p className="mb-4 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">개발 미리보기 · 상업 출시 전 Upbit 데이터 사용 승인이 필요합니다.</p>}
    <section className="overflow-hidden rounded-2xl border border-[#26303d] shadow-2xl"><div className="relative aspect-[9/16] max-h-[820px] w-full md:aspect-video"><WallpaperChart market={market} theme={theme} showPriceScale={preset.showPriceScale} showVolume={preset.showVolume} showLogo={preset.showLogo} showAnalysis={preset.showAnalysis}/>{market&&<div className={`pointer-events-none absolute bottom-5 left-5 ${theme==='dark'?'text-white':'text-[#111827]'}`}><div className="text-2xl font-semibold tabular-nums">{market.ticker.price.toLocaleString(undefined,{maximumFractionDigits:market.quoteCurrency==='KRW'?0:2})} {market.quoteCurrency}</div><div className={`mt-1 text-sm ${market.ticker.changePercent>=0?'text-bullish':'text-bearish'}`}>{market.ticker.changePercent>=0?'+':''}{market.ticker.changePercent.toFixed(2)}% · {market.provider}</div><div className="mt-1 text-[10px] opacity-60">{new Date(market.updatedAt).toLocaleString()}</div></div>}</div></section>
    <p className="mt-4 text-xs leading-5 text-neutral">브라우저 미리보기입니다. 실제 Android 라이브 월페이퍼는 네이티브 Canvas 렌더러가 화면 가시성과 절전 상태를 감지해 별도로 동작합니다.</p>
  </main>
}

function Control({label,children}:{label:string;children:React.ReactNode}){return <label className="text-xs text-neutral"><span className="mb-1 block">{label}</span><div className="[&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-[#354252] [&_select]:bg-background [&_select]:px-3 [&_select]:py-2 [&_select]:text-white">{children}</div></label>}
