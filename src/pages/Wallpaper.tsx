import {MARKET_INTERVALS,MARKET_SYMBOLS,marketApiRequest,wallpaperImagePath,type MarketInterval,type MarketSymbol} from '@5waveflow/market-data';
import {WALLPAPER_PRESETS,type WallpaperPresetId,type WallpaperTheme} from '@5waveflow/wallpaper';
import {useQuery} from '@tanstack/react-query';
import {useState,type ReactNode} from 'react';
import WallpaperChart from '../components/WallpaperChart';
import {getMarket} from '../lib/api';
import {scenarioScores,type ScenarioScores} from '../lib/scenarioScores';
import {downloadIPhoneWallpaper} from '../lib/wallpaperExport';
import type {MarketPayload} from '../types';

export default function Wallpaper(){
  const[symbol,setSymbol]=useState<MarketSymbol>('BTCUSDT'),[interval,setInterval]=useState<MarketInterval>('15m'),[theme,setTheme]=useState<WallpaperTheme>('dark'),[presetId,setPresetId]=useState<WallpaperPresetId>('ai'),[refreshMinutes,setRefreshMinutes]=useState(15);
  const preset=WALLPAPER_PRESETS.find(item=>item.id===presetId)!;
  const request=marketApiRequest({symbol,interval});
  const query=useQuery({queryKey:['wallpaper',symbol,interval],queryFn:()=>getMarket(request.symbol,request.interval,request.market),refetchInterval:refreshMinutes*60_000,staleTime:20_000});
  const market=query.data,scores=scenarioScores(market),imagePath=wallpaperImagePath({symbol,interval,theme,refreshMinutes}),imageUrl=typeof window==='undefined'?imagePath:`${window.location.origin}${imagePath}`;
  return <main className="mx-auto max-w-[1440px] px-4 py-6 md:px-8">
    <nav aria-label="배경화면 하위 메뉴" className="sticky top-16 z-30 mb-4 flex overflow-x-auto rounded-xl border border-[#26303d] bg-background/95 p-1.5 text-xs backdrop-blur"><SubMenu href="#preview">미리보기</SubMenu><SubMenu href="#customize">사용자 설정</SubMenu><SubMenu href="#presets">프리셋 안내</SubMenu><SubMenu href="#ios">iPhone 자동화</SubMenu><SubMenu href="#android">Android 적용</SubMenu></nav>
    <section id="customize" className="scroll-mt-32 mb-4 grid gap-3 rounded-xl border border-[#26303d] bg-surface/70 p-3 sm:grid-cols-2 lg:grid-cols-5">
      <Control label="종목"><select value={symbol} onChange={event=>setSymbol(event.target.value as MarketSymbol)}>{MARKET_SYMBOLS.map(value=><option key={value}>{value}</option>)}</select></Control>
      <Control label="시간봉"><select value={interval} onChange={event=>setInterval(event.target.value as MarketInterval)}>{MARKET_INTERVALS.map(value=><option key={value}>{value}</option>)}</select></Control>
      <Control label="프리셋"><select value={presetId} onChange={event=>setPresetId(event.target.value as WallpaperPresetId)}>{WALLPAPER_PRESETS.map(value=><option key={value.id} value={value.id}>{value.name}</option>)}</select></Control>
      <Control label="테마"><select value={theme} onChange={event=>setTheme(event.target.value as WallpaperTheme)}><option value="dark">Dark</option><option value="light">Light</option></select></Control>
      <Control label="희망 갱신 간격"><select value={refreshMinutes} onChange={event=>setRefreshMinutes(Number(event.target.value))}>{[1,5,10,15,30,60].map(value=><option key={value} value={value}>{value}분</option>)}</select></Control>
    </section>
    {symbol==='BTCKRW'&&<p className="mb-4 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">개발 미리보기 · 상업 출시 전 Upbit 데이터 사용 승인이 필요합니다.</p>}
    <section id="preview" className="scroll-mt-32 overflow-hidden rounded-2xl border border-[#26303d] shadow-2xl"><div className="relative aspect-[9/19.5] max-h-[900px] w-full md:aspect-video"><WallpaperChart market={market} theme={theme} showPriceScale={preset.showPriceScale} showVolume={preset.showVolume} showLogo={preset.showLogo} showAnalysis={preset.showAnalysis}/>{market&&<><div className={`pointer-events-none absolute bottom-5 left-5 ${theme==='dark'?'text-white':'text-[#111827]'}`}><div className="text-2xl font-semibold tabular-nums">{market.ticker.price.toLocaleString(undefined,{maximumFractionDigits:market.quoteCurrency==='KRW'?0:2})} {market.quoteCurrency}</div><div className={`mt-1 text-sm ${market.ticker.changePercent>=0?'text-bullish':'text-bearish'}`}>{market.ticker.changePercent>=0?'+':''}{market.ticker.changePercent.toFixed(2)}% · {market.provider}</div><div className="mt-1 text-[10px] opacity-60">{new Date(market.updatedAt).toLocaleString()}</div></div><div className={`pointer-events-none absolute right-3 top-12 rounded-xl border px-3 py-2 text-[10px] backdrop-blur-md sm:right-5 sm:top-5 sm:text-xs ${theme==='dark'?'border-white/10 bg-black/45 text-white':'border-black/10 bg-white/70 text-[#111827]'}`}><div className="mb-1 text-[9px] opacity-60">AI 정량 방향 분포</div><div className="flex gap-2 sm:gap-4"><span className="text-bullish">상승 {scores.bullish}%</span><span className="opacity-75">횡보 {scores.sideways}%</span><span className="text-bearish">하락 {scores.bearish}%</span></div></div></>}</div></section>
    <section id="presets" className="scroll-mt-32 mt-5 grid gap-3 md:grid-cols-3">{WALLPAPER_PRESETS.map(item=><button key={item.id} onClick={()=>setPresetId(item.id)} className={`rounded-xl border p-4 text-left transition ${presetId===item.id?'border-primary bg-primary/10':'border-[#26303d] bg-surface/60 hover:border-[#46566a]'}`}><div className="text-sm font-semibold">{item.name}</div><div className="mt-2 text-xs leading-5 text-neutral">{item.id==='minimal'?'가격과 캔들에 집중한 간결한 화면':item.id==='professional'?'가격축과 거래량을 함께 표시':'정량 분석 마커를 차트와 함께 표시'}</div></button>)}</section>
    <IOSShortcutSetup imageUrl={imageUrl} market={market} theme={theme} scores={scores} refreshing={query.isFetching} onRefresh={()=>query.refetch()}/>
    <section id="android" className="scroll-mt-32 mt-5 rounded-xl border border-[#26303d] bg-surface/70 p-5"><div className="label">ANDROID LIVE WALLPAPER</div><h2 className="mt-2 text-lg font-semibold">홈 화면에 적용</h2><p className="mt-3 text-xs leading-5 text-neutral">기존 Android 라이브 월페이퍼는 그대로 유지됩니다. 앱에서 설정한 뒤 시스템 미리보기로 적용하며 화면이 꺼지면 갱신을 중단합니다.</p></section>
    <section className="mt-5 rounded-xl border border-[#26303d] bg-surface/70 p-5"><div className="label">WIDGETKIT</div><h2 className="mt-2 text-lg font-semibold">iOS 위젯은 별도 기능</h2><p className="mt-3 text-xs leading-5 text-neutral">위젯은 배경화면 자동화와 분리해 PHASE C에서 구현합니다. WidgetKit 갱신 시각은 시스템 예산과 정책에 따라 달라지며 요청한 시간에 정확히 갱신된다고 보장할 수 없습니다.</p></section>
    <p className="mt-4 text-xs leading-5 text-neutral">브라우저 미리보기입니다. 실제 Android 라이브 월페이퍼는 네이티브 Canvas 렌더러가 화면 가시성과 절전 상태를 감지해 별도로 동작합니다.</p>
  </main>
}

function Control({label,children}:{label:string;children:ReactNode}){return <label className="text-xs text-neutral"><span className="mb-1 block">{label}</span><div className="[&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-[#354252] [&_select]:bg-background [&_select]:px-3 [&_select]:py-2 [&_select]:text-white">{children}</div></label>}
function SubMenu({href,children}:{href:string;children:ReactNode}){return <a href={href} className="shrink-0 rounded-lg px-3 py-2 text-neutral transition hover:bg-surface hover:text-white">{children}</a>}

function IOSShortcutSetup({imageUrl,market,theme,scores,refreshing,onRefresh}:{imageUrl:string;market:MarketPayload|undefined;theme:WallpaperTheme;scores:ScenarioScores;refreshing:boolean;onRefresh:()=>unknown}){
  const[copied,setCopied]=useState(false);
  const copy=()=>navigator.clipboard.writeText(imageUrl).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500)}).catch(()=>undefined);
  const startSetup=()=>{void copy();window.location.href='shortcuts://create-shortcut'};
  const runUrl=`shortcuts://run-shortcut?name=${encodeURIComponent('5WaveFlow Wallpaper')}`;
  return <section id="ios" className="scroll-mt-32 mt-5 rounded-xl border border-[#26303d] bg-surface/70 p-5">
    <div className="label">IOS SHORTCUT AUTOMATION</div><h2 className="mt-2 text-lg font-semibold">최신 차트로 배경화면 갱신</h2>
    <div className="mt-4 rounded-xl border border-primary/40 bg-primary/10 p-4"><div className="text-sm font-semibold">간편 설정</div><p className="mt-1 text-xs leading-5 text-neutral">이미지 URL을 복사하고 새 단축어 편집기를 바로 엽니다. 열린 화면에서 아래 3개 동작만 추가하세요.</p><button type="button" onClick={startSetup} className="mt-3 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white sm:w-auto">URL 복사하고 단축어 만들기</button></div>
    <div className="mt-3 rounded-lg border border-[#354252] bg-background p-3"><div className="break-all font-mono text-[10px] leading-5 text-neutral">{imageUrl}</div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={()=>void copy()} className="rounded-lg border border-[#354252] px-4 py-2 text-xs text-white">{copied?'복사됨':'URL 다시 복사'}</button><button type="button" onClick={onRefresh} disabled={refreshing} className="rounded-lg border border-[#354252] px-4 py-2 text-xs text-white disabled:opacity-50">{refreshing?'갱신 중…':'지금 수동 갱신'}</button><button type="button" disabled={!market} onClick={()=>market&&downloadIPhoneWallpaper(market,theme,scores)} className="rounded-lg border border-[#354252] px-4 py-2 text-xs text-white disabled:opacity-40">PNG 직접 저장</button></div></div>
    <ol className="mt-4 grid gap-3 text-xs leading-5 text-neutral md:grid-cols-3"><li><strong className="text-white">1.</strong> `URL` 동작을 추가하고 복사된 주소를 붙여넣습니다.</li><li><strong className="text-white">2.</strong> `URL의 콘텐츠 가져오기`를 GET으로 추가합니다.</li><li><strong className="text-white">3.</strong> `배경화면 사진 설정`을 추가하고 단축어 이름을 `5WaveFlow Wallpaper`로 저장합니다.</li></ol>
    <div className="mt-4 flex flex-wrap gap-2"><a href={runUrl} className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-background">설치된 단축어로 지금 적용</a><a href="shortcuts://" className="rounded-lg border border-[#354252] px-4 py-2 text-xs text-white">단축어 앱 열기</a></div>
    <p className="mt-4 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs leading-5 text-primary">자동 갱신은 하단 `자동화` 탭 → `+` → `개인용 자동화 생성` → `특정 시간`에서 위 단축어를 선택합니다. `표준 시간대로 변경`은 자동화 트리거가 아닙니다.</p><p className="mt-3 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs leading-5 text-warning">Apple 정책상 웹사이트가 확인 없이 단축어를 설치하거나 배경화면을 변경할 수는 없습니다. 최초 1회 단축어 생성과 권한 승인이 필요하며, 실행 시각과 잠금 상태 실행은 iOS가 보장하지 않습니다.</p>
  </section>
}
