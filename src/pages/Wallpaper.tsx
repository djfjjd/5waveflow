import {MARKET_INTERVALS,MARKET_SYMBOLS,marketApiRequest,type MarketInterval,type MarketSymbol} from '@5waveflow/market-data';
import {WALLPAPER_PRESETS,type WallpaperPresetId,type WallpaperTheme} from '@5waveflow/wallpaper';
import {useQuery} from '@tanstack/react-query';
import {useState,type ReactNode} from 'react';
import WallpaperChart from '../components/WallpaperChart';
import {getMarket} from '../lib/api';
import {scenarioScores} from '../lib/scenarioScores';
import {downloadIPhoneWallpaper} from '../lib/wallpaperExport';

export default function Wallpaper(){
  const[symbol,setSymbol]=useState<MarketSymbol>('BTCUSDT'),[interval,setInterval]=useState<MarketInterval>('15m'),[theme,setTheme]=useState<WallpaperTheme>('dark'),[presetId,setPresetId]=useState<WallpaperPresetId>('ai');
  const preset=WALLPAPER_PRESETS.find(item=>item.id===presetId)!;
  const request=marketApiRequest({symbol,interval});
  const query=useQuery({queryKey:['wallpaper',symbol,interval],queryFn:()=>getMarket(request.symbol,request.interval,request.market),refetchInterval:60_000,staleTime:20_000});
  const market=query.data,scores=scenarioScores(market);
  return <main className="mx-auto max-w-[1440px] px-4 py-6 md:px-8">
    <nav aria-label="배경화면 하위 메뉴" className="sticky top-16 z-30 mb-4 flex overflow-x-auto rounded-xl border border-[#26303d] bg-background/95 p-1.5 text-xs backdrop-blur"><SubMenu href="#preview">미리보기</SubMenu><SubMenu href="#customize">사용자 설정</SubMenu><SubMenu href="#presets">프리셋 안내</SubMenu><SubMenu href="#android">Android 적용</SubMenu></nav>
    <section id="customize" className="scroll-mt-32 mb-4 grid gap-3 rounded-xl border border-[#26303d] bg-surface/70 p-3 md:grid-cols-4">
      <Control label="종목"><select value={symbol} onChange={event=>setSymbol(event.target.value as MarketSymbol)}>{MARKET_SYMBOLS.map(value=><option key={value}>{value}</option>)}</select></Control>
      <Control label="시간봉"><select value={interval} onChange={event=>setInterval(event.target.value as MarketInterval)}>{MARKET_INTERVALS.map(value=><option key={value}>{value}</option>)}</select></Control>
      <Control label="프리셋"><select value={presetId} onChange={event=>setPresetId(event.target.value as WallpaperPresetId)}>{WALLPAPER_PRESETS.map(value=><option key={value.id} value={value.id}>{value.name}</option>)}</select></Control>
      <Control label="테마"><select value={theme} onChange={event=>setTheme(event.target.value as WallpaperTheme)}><option value="dark">Dark</option><option value="light">Light</option></select></Control>
    </section>
    {symbol==='BTCKRW'&&<p className="mb-4 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">개발 미리보기 · 상업 출시 전 Upbit 데이터 사용 승인이 필요합니다.</p>}
    <section id="preview" className="scroll-mt-32 overflow-hidden rounded-2xl border border-[#26303d] shadow-2xl"><div className="relative aspect-[9/19.5] max-h-[900px] w-full md:aspect-video"><WallpaperChart market={market} theme={theme} showPriceScale={preset.showPriceScale} showVolume={preset.showVolume} showLogo={preset.showLogo} showAnalysis={preset.showAnalysis}/>{market&&<><div className={`pointer-events-none absolute bottom-5 left-5 ${theme==='dark'?'text-white':'text-[#111827]'}`}><div className="text-2xl font-semibold tabular-nums">{market.ticker.price.toLocaleString(undefined,{maximumFractionDigits:market.quoteCurrency==='KRW'?0:2})} {market.quoteCurrency}</div><div className={`mt-1 text-sm ${market.ticker.changePercent>=0?'text-bullish':'text-bearish'}`}>{market.ticker.changePercent>=0?'+':''}{market.ticker.changePercent.toFixed(2)}% · {market.provider}</div><div className="mt-1 text-[10px] opacity-60">{new Date(market.updatedAt).toLocaleString()}</div></div><div className={`pointer-events-none absolute right-3 top-12 rounded-xl border px-3 py-2 text-[10px] backdrop-blur-md sm:right-5 sm:top-5 sm:text-xs ${theme==='dark'?'border-white/10 bg-black/45 text-white':'border-black/10 bg-white/70 text-[#111827]'}`}><div className="mb-1 text-[9px] opacity-60">AI 정량 방향 분포</div><div className="flex gap-2 sm:gap-4"><span className="text-bullish">상승 {scores.bullish}%</span><span className="opacity-75">횡보 {scores.sideways}%</span><span className="text-bearish">하락 {scores.bearish}%</span></div></div></>}</div></section>
    <section id="presets" className="scroll-mt-32 mt-5 grid gap-3 md:grid-cols-3">{WALLPAPER_PRESETS.map(item=><button key={item.id} onClick={()=>setPresetId(item.id)} className={`rounded-xl border p-4 text-left transition ${presetId===item.id?'border-primary bg-primary/10':'border-[#26303d] bg-surface/60 hover:border-[#46566a]'}`}><div className="text-sm font-semibold">{item.name}</div><div className="mt-2 text-xs leading-5 text-neutral">{item.id==='minimal'?'가격과 캔들에 집중한 간결한 화면':item.id==='professional'?'가격축과 거래량을 함께 표시':'정량 분석 마커를 차트와 함께 표시'}</div></button>)}</section>
    <section id="android" className="scroll-mt-32 mt-5 grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-[#26303d] bg-surface/70 p-5"><div className="label">ANDROID LIVE WALLPAPER</div><h2 className="mt-2 text-lg font-semibold">홈 화면에 적용</h2><p className="mt-3 text-xs leading-5 text-neutral">앱에서 설정한 뒤 시스템 라이브 월페이퍼 미리보기로 적용합니다. 화면이 꺼지면 갱신을 중단합니다.</p></div><div className="rounded-xl border border-[#26303d] bg-surface/70 p-5"><div className="label">IPHONE WALLPAPER</div><h2 className="mt-2 text-lg font-semibold">정적 배경화면 이미지 저장</h2><p className="mt-3 text-xs leading-5 text-neutral">iOS 정책상 지속 실행형 라이브 차트 대신 현재 데이터와 방향 분포가 담긴 세로 PNG를 저장합니다.</p><button type="button" disabled={!market} onClick={()=>market&&downloadIPhoneWallpaper(market,theme,scores)} className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">iPhone용 이미지 저장</button></div></section>
    <p className="mt-4 text-xs leading-5 text-neutral">브라우저 미리보기입니다. 실제 Android 라이브 월페이퍼는 네이티브 Canvas 렌더러가 화면 가시성과 절전 상태를 감지해 별도로 동작합니다.</p>
  </main>
}

function Control({label,children}:{label:string;children:ReactNode}){return <label className="text-xs text-neutral"><span className="mb-1 block">{label}</span><div className="[&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-[#354252] [&_select]:bg-background [&_select]:px-3 [&_select]:py-2 [&_select]:text-white">{children}</div></label>}
function SubMenu({href,children}:{href:string;children:ReactNode}){return <a href={href} className="shrink-0 rounded-lg px-3 py-2 text-neutral transition hover:bg-surface hover:text-white">{children}</a>}
