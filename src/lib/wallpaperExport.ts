import type {ScenarioScores} from './scenarioScores';
import type {MarketPayload} from '../types';
import type {WallpaperTheme} from '@5waveflow/wallpaper';

export function downloadIPhoneWallpaper(market:MarketPayload,theme:WallpaperTheme,scores:ScenarioScores){
  const canvas=document.createElement('canvas');canvas.width=1179;canvas.height=2556;const ctx=canvas.getContext('2d');if(!ctx)return;
  const dark=theme==='dark',fg=dark?'#ffffff':'#111827',muted=dark?'#8b95a5':'#526071';ctx.fillStyle=dark?'#0b1017':'#f4f7fb';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle=fg;ctx.font='700 56px system-ui';ctx.fillText('5WaveFlow Live',72,170);ctx.font='700 92px system-ui';ctx.fillText(market.ticker.price.toLocaleString(undefined,{maximumFractionDigits:market.quoteCurrency==='KRW'?0:2}),72,320);ctx.font='500 40px system-ui';ctx.fillStyle=market.ticker.changePercent>=0?'#00c896':'#ff5c70';ctx.fillText(`${market.ticker.changePercent>=0?'+':''}${market.ticker.changePercent.toFixed(2)}% · ${market.symbol} · ${market.interval}`,72,390);
  const rows=[['상승',scores.bullish,'#00c896'],['횡보',scores.sideways,muted],['하락',scores.bearish,'#ff5c70']] as const;ctx.font='600 34px system-ui';rows.forEach(([label,value,color],index)=>{const x=72+index*345;ctx.fillStyle=color;ctx.fillText(`${label} ${value}%`,x,500)});
  const candles=market.candles.slice(-90),left=72,right=1107,top=620,bottom=2110,high=Math.max(...candles.map(c=>c.high)),low=Math.min(...candles.map(c=>c.low)),range=Math.max(high-low,.0001),step=(right-left)/Math.max(candles.length,1);candles.forEach((c,index)=>{const x=left+step*(index+.5),y=(value:number)=>top+(high-value)/range*(bottom-top);ctx.strokeStyle=ctx.fillStyle=c.close>=c.open?'#00c896':'#ff5c70';ctx.lineWidth=Math.max(2,step*.15);ctx.beginPath();ctx.moveTo(x,y(c.high));ctx.lineTo(x,y(c.low));ctx.stroke();ctx.fillRect(x-step*.3,Math.min(y(c.open),y(c.close)),step*.6,Math.max(2,Math.abs(y(c.open)-y(c.close))))});
  ctx.fillStyle=muted;ctx.font='400 28px system-ui';ctx.fillText(`AI 정량 방향 분포 · ${market.provider}`,72,2230);ctx.fillText(new Date(market.updatedAt).toLocaleString(),72,2280);ctx.fillText('정보 제공 목적 · 예측 성공률이 아닙니다.',72,2340);
  canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`5waveflow-${market.symbol}-${market.interval}-iphone.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)},'image/png');
}
