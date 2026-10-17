import {MARKET_INTERVALS,MARKET_SYMBOLS,wallpaperImagePath,type MarketInterval,type MarketSymbol} from '@5waveflow/market-data';
import type {WallpaperTheme} from '@5waveflow/wallpaper';
import {useEffect,useState,type ReactNode} from 'react';
import {appleShortcutShareUrl} from '../lib/shortcut';
import {useSiteTheme} from '../lib/useSiteTheme';

const sharedShortcutUrl=appleShortcutShareUrl(import.meta.env.VITE_IOS_SHORTCUT_URL)||'https://www.icloud.com/shortcuts/581d4185833647de8dee4e1a38f5a916';
const symbolLabels:Record<MarketSymbol,string>={'KRX:005930':'삼성전자','KRX:035720':'카카오','KRX:000660':'하이닉스',BTCUSDT:'비트코인/USDT',BTCKRW:'비트코인/원',ETHUSDT:'이더리움',XRPUSDT:'리플','NASDAQ:NVDA':'NVIDIA','NASDAQ:TSLA':'Tesla'};

export default function Wallpaper(){
  const siteTheme=useSiteTheme();
  const[symbol,setSymbol]=useState<MarketSymbol>('BTCUSDT'),[interval,setInterval]=useState<MarketInterval>('15m'),[theme,setTheme]=useState<WallpaperTheme>(siteTheme),[refreshMinutes,setRefreshMinutes]=useState(15);
  useEffect(()=>setTheme(siteTheme),[siteTheme]);
  const imagePath=wallpaperImagePath({symbol,interval,theme,refreshMinutes}),imageUrl=typeof window==='undefined'?imagePath:`${window.location.origin}${imagePath}`;
  return <main className="theme-page mx-auto max-w-[1440px] px-4 py-6 md:px-8">
    <section id="preview" className="scroll-mt-32 grid grid-cols-2 place-items-center gap-3 rounded-2xl border border-[#26303d] bg-surface/40 p-3 shadow-2xl sm:gap-6 sm:p-4">
      <DevicePreview label="iPhone" imageUrl={imageUrl} kind="iphone"/>
      <DevicePreview label="Galaxy" imageUrl={imageUrl} kind="android"/>
    </section>
    <section id="customize" className="mt-4 scroll-mt-32 mb-4 grid gap-3 rounded-xl border border-[#26303d] bg-surface/70 p-3 sm:grid-cols-2 lg:grid-cols-4">
      <Control label="종목"><select value={symbol} onChange={event=>setSymbol(event.target.value as MarketSymbol)}>{MARKET_SYMBOLS.map(value=><option key={value} value={value}>{symbolLabels[value]}</option>)}</select></Control>
      <Control label="시간봉"><select value={interval} onChange={event=>setInterval(event.target.value as MarketInterval)}>{MARKET_INTERVALS.map(value=><option key={value}>{value}</option>)}</select></Control>
      <Control label="테마"><select value={theme} onChange={event=>setTheme(event.target.value as WallpaperTheme)}><option value="dark">Dark</option><option value="light">Light</option></select></Control>
      <Control label="희망 갱신 간격"><select value={refreshMinutes} onChange={event=>setRefreshMinutes(Number(event.target.value))}>{[1,5,10,15,30,60].map(value=><option key={value} value={value}>{value}분</option>)}</select></Control>
    </section>
    <nav aria-label="배경화면 하위 메뉴" className="sticky top-16 z-30 mb-4 flex overflow-x-auto rounded-xl border border-[#26303d] bg-background/95 p-1.5 text-xs backdrop-blur"><SubMenu href="#preview">미리보기</SubMenu><SubMenu href="#customize">사용자 설정</SubMenu><SubMenu href="#ios">iPhone 자동화</SubMenu></nav>
    {symbol==='BTCKRW'&&<p className="mb-4 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">개발 미리보기 · 상업 출시 전 Upbit 데이터 사용 승인이 필요합니다.</p>}
    <IOSShortcutSetup/>
  </main>
}

function DevicePreview({label,imageUrl,kind}:{label:string;imageUrl:string;kind:'iphone'|'android'}){
  return <figure className="flex min-w-0 flex-col items-center"><figcaption className="mb-2 text-xs font-semibold text-neutral sm:text-sm">{label}</figcaption><div className={`relative w-[34vw] max-w-[210px] overflow-hidden border-[4px] bg-black shadow-xl sm:border-[6px] ${kind==='iphone'?'aspect-[9/19.5] rounded-[1.6rem] border-[#1d232c] sm:rounded-[2.4rem]':'aspect-[9/20] rounded-[1.1rem] border-[#303742] sm:rounded-[1.7rem]'}`}>
    {kind==='iphone'?<div className="absolute left-1/2 top-2 z-10 h-3 w-12 -translate-x-1/2 rounded-full bg-black sm:top-3 sm:h-5 sm:w-20"/>:<div className="absolute left-1/2 top-2 z-10 h-2 w-2 -translate-x-1/2 rounded-full bg-black/90 sm:top-3 sm:h-3 sm:w-3"/>}
    <img src={imageUrl} alt={`${label} 5WaveFlow 배경화면 미리보기`} className="h-full w-full object-cover"/>
  </div></figure>
}

function Control({label,children}:{label:string;children:ReactNode}){return <label className="text-xs text-neutral"><span className="mb-1 block">{label}</span><div className="[&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-[#354252] [&_select]:bg-background [&_select]:px-3 [&_select]:py-2 [&_select]:text-white">{children}</div></label>}
function SubMenu({href,children}:{href:string;children:ReactNode}){return <a href={href} className="shrink-0 rounded-lg px-3 py-2 text-neutral transition hover:bg-surface hover:text-white">{children}</a>}

function IOSShortcutSetup(){
  return <section id="ios" className="scroll-mt-32 mt-5 rounded-xl border border-[#26303d] bg-surface/70 p-5">
    <a href={sharedShortcutUrl} target="_blank" rel="noreferrer" className="inline-flex w-full justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white sm:w-auto">5WaveFlow 단축어 원클릭 설치</a>
    <ol className="mt-4 grid gap-3 text-xs leading-5 text-neutral md:grid-cols-3"><li><strong className="text-white">1.</strong> 원클릭 설치 버튼을 누릅니다.</li><li><strong className="text-white">2.</strong> iCloud 공유 화면에서 단축어를 추가합니다.</li><li><strong className="text-white">3.</strong> 추가된 단축어를 실행하고 필요한 접근을 허용합니다.</li></ol>
  </section>
}
