type Candle={time:number;open:number;high:number;low:number;close:number;volume:number};
type MarketResponse={symbol:string;interval:string;provider:string;updatedAt:string;ticker:{price:number;changePercent:number};candles:Candle[];indicators:{rsi:number|null;macd:number|null;signal:number|null;ema20:number|null;ema50:number|null;ema200:number|null;volumeChangePercent:number|null}};
const symbols=new Set(['KRX:005930','KRX:035720','KRX:000660','BTCUSDT','BTCKRW','ETHUSDT','XRPUSDT','NASDAQ:NVDA','NASDAQ:TSLA']),cryptoSymbols=new Set(['BTCUSDT','ETHUSDT','XRPUSDT']),intervals=new Set(['1m','5m','15m','1h','4h','1d']);

export const onRequestGet:PagesFunction=async({request})=>{
  const url=new URL(request.url),symbol=(url.searchParams.get('symbol')||'BTCUSDT').toUpperCase(),interval=url.searchParams.get('interval')||'15m',theme=url.searchParams.get('theme')==='light'?'light':'dark',refresh=Math.min(60,Math.max(1,Number(url.searchParams.get('refresh'))||15));
  if(!symbols.has(symbol)||!intervals.has(interval))return new Response('Unsupported symbol or interval',{status:400});
  try{
    const marketUrl=new URL('/api/market',url),marketSymbol=symbol==='BTCKRW'?'BTCUSDT':symbol;marketUrl.searchParams.set('symbol',marketSymbol);marketUrl.searchParams.set('interval',interval);if(symbol==='BTCKRW')marketUrl.searchParams.set('market','upbit');else if(cryptoSymbols.has(symbol))marketUrl.searchParams.set('market','usdt');
    const response=await fetch(marketUrl.toString(),{headers:{accept:'application/json'}});if(!response.ok)throw new Error(`Market API ${response.status}`);const market=await response.json() as MarketResponse;
    const png=await render(market,theme,symbol,interval);return new Response(png,{headers:{'content-type':'image/png','content-disposition':`inline; filename="5waveflow-${symbol}-${interval}.png"`,'cache-control':`public, max-age=${Math.min(refresh*60,300)}, s-maxage=${refresh*60}`,'x-content-type-options':'nosniff','x-5waveflow-data-time':market.updatedAt}});
  }catch(error){return new Response(error instanceof Error?error.message:'Wallpaper unavailable',{status:502})}
};

async function render(market:MarketResponse,theme:'dark'|'light',displaySymbol:string,displayInterval:string){
  const width=1170,height=2535,pixels=new Uint8Array(width*height*4),background=theme==='dark'?[11,16,23]:[244,247,251],foreground=theme==='dark'?[255,255,255]:[17,24,39],muted=theme==='dark'?[139,149,165]:[82,96,113];fill(pixels,width,height,background);
  // Keep the top 600 px empty for the iOS Lock Screen clock and status area.
  const left=72,right=1098,chartTop=980,top=1040,bottom=2200,price=formatPrice(market.ticker.price),change=`${market.ticker.changePercent>=0?'+':''}${market.ticker.changePercent.toFixed(2)}%`;
  text(pixels,width,left,chartTop,`${displaySymbol} ${displayInterval}`.toUpperCase(),muted,5);text(pixels,width,right-textWidth(price,7),chartTop,price,foreground,7);text(pixels,width,right-textWidth(change,5),chartTop+56,change,market.ticker.changePercent>=0?[0,200,150]:[255,92,112],5);
  const candles=market.candles.slice(-90),high=Math.max(...candles.map(c=>c.high)),low=Math.min(...candles.map(c=>c.low)),range=Math.max(high-low,.000001),step=(right-left)/Math.max(candles.length,1),y=(value:number)=>Math.round(top+(high-value)/range*(bottom-top));
  for(let i=0;i<=4;i++){const gy=Math.round(top+(bottom-top)*i/4);rect(pixels,width,left,gy,right-left,2,theme==='dark'?[27,36,48]:[220,226,234])}
  candles.forEach((c,index)=>{const x=Math.round(left+step*(index+.5)),color=c.close>=c.open?[0,200,150]:[255,92,112];rect(pixels,width,x-1,y(c.high),3,Math.max(2,y(c.low)-y(c.high)),color);rect(pixels,width,Math.round(x-step*.28),Math.min(y(c.open),y(c.close)),Math.max(3,Math.round(step*.56)),Math.max(3,Math.abs(y(c.open)-y(c.close))),color)});
  const score=directionScores(market.indicators),scoreOffsetX=25;[[`↗ ${score.up}%`,[0,200,150]],[`→ ${score.flat}%`,muted],[`↘ ${score.down}%`,[255,92,112]]].forEach(([label,color],index)=>{const value=label as string;vectorText(pixels,width,Math.round((width-vectorTextWidth(value,8))/2)+scoreOffsetX,1450+index*72,value,color as RGB,8)});
  const logo='5WAVEFLOW',timestamp=formatTimestamp(market.updatedAt);text(pixels,width,right-textWidth(timestamp,5),2085,timestamp,muted,5);text(pixels,width,right-textWidth(logo,5),2135,logo,muted,5);return encodePng(width,height,pixels);
}

type RGB=number[];
function fill(p:Uint8Array,w:number,h:number,c:RGB){for(let i=0;i<w*h;i++){const n=i*4;p[n]=c[0];p[n+1]=c[1];p[n+2]=c[2];p[n+3]=255}}
function rect(p:Uint8Array,w:number,x:number,y:number,rw:number,rh:number,c:RGB){const h=p.length/(w*4);for(let py=Math.max(0,y);py<Math.min(h,y+rh);py++)for(let px=Math.max(0,x);px<Math.min(w,x+rw);px++){const n=(py*w+px)*4;p[n]=c[0];p[n+1]=c[1];p[n+2]=c[2]}}
const glyphs:Record<string,string>=Object.fromEntries(Object.entries({A:'0111010001111111000110001',B:'1111010001111101000111110',C:'0111110000100001000001111',D:'1111010001100011000111110',E:'1111110000111101000011111',F:'1111110000111101000010000',H:'1000110001111111000110001',I:'1111100100001000010011111',L:'1000010000100001000011111',M:'1000111011101011000110001',N:'1000111001101011001110001',O:'0111010001100011000101110',P:'1111010001111101000010000',R:'1111010001111101010010010',S:'0111110000011100000111110',T:'1111100100001000010000100',U:'1000110001100011000101110',V:'1000110001100010101000100',W:'1000110001101011101110001',Y:'1000110001010100010000100','0':'0111010011101011100101110','1':'0010001100001000010001110','2':'0111010001000100010011111','3':'1111000001001100000111110','4':'1001010010111110001000010','5':'1111110000111100000111110','6':'0111110000111101000101110','7':'1111100010001000100001000','8':'0111010001011101000101110','9':'0111010001011110000111110','+':'0010000100111110010000100','-':'0000000000111110000000000','.':'0000000000000000011000110',':':'0000000100000000010000000','%':'1100100010001000100010011','↗':'0000100010001001010011000','→':'0000000100111110010000000','↘':'1100010100001000001000001'}).map(([k,v])=>[k,v]));
function blend(p:Uint8Array,w:number,x:number,y:number,c:RGB,alpha:number){const h=p.length/(w*4);if(x<0||x>=w||y<0||y>=h)return;const n=(y*w+x)*4,a=Math.max(0,Math.min(1,alpha));p[n]=Math.round(p[n]*(1-a)+c[0]*a);p[n+1]=Math.round(p[n+1]*(1-a)+c[1]*a);p[n+2]=Math.round(p[n+2]*(1-a)+c[2]*a)}
function smoothCell(p:Uint8Array,w:number,x:number,y:number,size:number,c:RGB){for(let py=-1;py<=size;py++)for(let px=-1;px<=size;px++){const edge=px<0||py<0||px===size||py===size;blend(p,w,x+px,y+py,c,edge?.28:1)}}
function text(p:Uint8Array,w:number,x:number,y:number,value:string,c:RGB,scale:number){let cursor=x;for(const char of value){if(char===' '){cursor+=scale*4;continue}const bits=glyphs[char];if(bits)for(let i=0;i<25;i++)if(bits[i]==='1')smoothCell(p,w,cursor+(i%5)*scale,y+Math.floor(i/5)*scale,scale,c);cursor+=scale*6}}
function textWidth(value:string,scale:number){let width=0;for(const char of value)width+=scale*(char===' '?4:6);return width}
type Point=[number,number];
const strokes:Record<string,Point[][]>={
  '0':[[[1,0],[3,0],[4,1],[4,3],[3,4],[1,4],[0,3],[0,1],[1,0]]],
  '1':[[[1,1],[2,0],[2,4]],[[1,4],[3,4]]],
  '2':[[[0,1],[1,0],[3,0],[4,1],[4,2],[0,4],[4,4]]],
  '3':[[[0,0],[3,0],[4,1],[3,2],[4,3],[3,4],[0,4]],[[2,2],[3,2]]],
  '4':[[[3,4],[3,0]],[[3,2],[0,2],[2,0]]],
  '5':[[[4,0],[0,0],[0,2],[3,2],[4,3],[3,4],[0,4]]],
  '6':[[[4,0],[1,0],[0,1],[0,3],[1,4],[3,4],[4,3],[4,2],[0,2]]],
  '7':[[[0,0],[4,0],[1,4]]],
  '8':[[[1,0],[3,0],[4,1],[3,2],[1,2],[0,1],[1,0]],[[1,2],[0,3],[1,4],[3,4],[4,3],[3,2]]],
  '9':[[[4,2],[0,2],[0,1],[1,0],[3,0],[4,1],[4,3],[3,4],[0,4]]],
  '%':[[[0,4],[4,0]],[[.5,.5],[1,.5],[1,1],[.5,1],[.5,.5]],[[3,3],[3.5,3],[3.5,3.5],[3,3.5],[3,3]]],
  '↗':[[[0,4],[4,0]],[[1,0],[4,0],[4,3]]],
  '→':[[[0,2],[4,2]],[[2,0],[4,2],[2,4]]],
  '↘':[[[0,0],[4,4]],[[4,1],[4,4],[1,4]]]
};
function smoothDot(p:Uint8Array,w:number,cx:number,cy:number,radius:number,c:RGB){const edge=radius+1;for(let y=Math.floor(cy-edge);y<=Math.ceil(cy+edge);y++)for(let x=Math.floor(cx-edge);x<=Math.ceil(cx+edge);x++){const distance=Math.hypot(x+.5-cx,y+.5-cy),alpha=Math.max(0,Math.min(1,radius+.6-distance));if(alpha)blend(p,w,x,y,c,alpha)}}
function smoothLine(p:Uint8Array,w:number,a:Point,b:Point,x:number,y:number,scale:number,c:RGB){const x1=x+a[0]*scale,y1=y+a[1]*scale,x2=x+b[0]*scale,y2=y+b[1]*scale,length=Math.max(1,Math.hypot(x2-x1,y2-y1)),steps=Math.ceil(length*1.5);for(let i=0;i<=steps;i++){const t=i/steps;smoothDot(p,w,x1+(x2-x1)*t,y1+(y2-y1)*t,scale*.18,c)}}
function vectorText(p:Uint8Array,w:number,x:number,y:number,value:string,c:RGB,scale:number){let cursor=x;for(const char of value){if(char===' '){cursor+=scale*3;continue}for(const path of strokes[char]??[])for(let i=1;i<path.length;i++)smoothLine(p,w,path[i-1],path[i],cursor,y,scale,c);cursor+=scale*6}}
function vectorTextWidth(value:string,scale:number){return[...value].reduce((width,char)=>width+scale*(char===' '?3:6),0)}
function formatPrice(value:number){return value>=1000?Math.round(value).toString():value.toFixed(2)}
function formatTimestamp(value:string){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value)),part=(type:string)=>parts.find(item=>item.type===type)?.value??'00';return`${part('year')}.${part('month')}.${part('day')}.${part('hour')}:${part('minute')}`}
function directionScores(i:MarketResponse['indicators']){let up=20,flat=20,down=20;if(i.rsi!=null){if(i.rsi>55)up+=20;else if(i.rsi<45)down+=20;else flat+=20}if(i.macd!=null&&i.signal!=null){if(i.macd>i.signal)up+=20;else down+=20}if(i.ema20!=null&&i.ema50!=null&&i.ema200!=null){if(i.ema20>i.ema50&&i.ema50>i.ema200)up+=25;else if(i.ema20<i.ema50&&i.ema50<i.ema200)down+=25;else flat+=25}if(Math.abs(i.volumeChangePercent??0)<10)flat+=15;const total=up+flat+down,u=Math.round(up/total*100),f=Math.round(flat/total*100);return{up:u,flat:f,down:100-u-f}}
async function encodePng(w:number,h:number,rgba:Uint8Array){const raw=new Uint8Array(h*(w*4+1));for(let y=0;y<h;y++)raw.set(rgba.subarray(y*w*4,(y+1)*w*4),y*(w*4+1)+1);const stream=new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate'));const compressed=new Uint8Array(await new Response(stream).arrayBuffer());return concat([new Uint8Array([137,80,78,71,13,10,26,10]),chunk('IHDR',concat([u32(w),u32(h),new Uint8Array([8,6,0,0,0])])),chunk('IDAT',compressed),chunk('IEND',new Uint8Array())])}
function concat(parts:Uint8Array[]){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let offset=0;for(const part of parts){out.set(part,offset);offset+=part.length}return out}
function u32(n:number){return new Uint8Array([(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255])}
function chunk(name:string,data:Uint8Array){const type=new TextEncoder().encode(name),body=concat([type,data]);return concat([u32(data.length),body,u32(crc(body))])}
function crc(data:Uint8Array){let value=0xffffffff;for(const byte of data){value^=byte;for(let k=0;k<8;k++)value=(value>>>1)^((value&1)?0xedb88320:0)}return(value^0xffffffff)>>>0}
