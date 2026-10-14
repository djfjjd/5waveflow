import {useQuery} from '@tanstack/react-query';
import {ArrowDownRight,ArrowUpRight,RefreshCw} from 'lucide-react';

type Quote={symbol:string;price:number;changePercent:number;updatedAt:string};

async function getQuote(){
  const response=await fetch('/api/upbit',{signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error('Upbit quote unavailable');
  return response.json() as Promise<Quote>;
}

export default function UpbitQuoteCard(){
  const query=useQuery({queryKey:['quote','UPBIT:BTCKRW'],queryFn:getQuote,refetchInterval:15_000,staleTime:10_000});
  const quote=query.data;
  const up=(quote?.changePercent??0)>=0;
  return <article className="card min-w-0 overflow-hidden">
    <div className="flex min-w-0 items-center justify-between border-b border-[#25303c] px-2 py-2 sm:px-4 sm:py-3"><h2 className="min-w-0 whitespace-nowrap text-[9px] font-semibold tracking-tight sm:text-sm"><span className="sm:hidden">BTC / KRW</span><span className="hidden sm:inline">BTC / KRW · Upbit</span></h2><span className="hidden text-[10px] text-neutral md:block">LIVE</span></div>
    <div className="flex min-h-[82px] flex-col justify-center px-2 py-3 sm:min-h-[96px] sm:px-4">
      {quote?<><div className="whitespace-nowrap text-[11px] font-semibold tracking-tight tabular-nums sm:text-2xl">{Math.round(quote.price).toLocaleString('ko-KR')}원</div><div className={`mt-2 flex items-center gap-0.5 text-[10px] font-medium sm:gap-1 sm:text-sm ${up?'text-bullish':'text-bearish'}`}>{up?<ArrowUpRight className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5"/>:<ArrowDownRight className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5"/>} {quote.changePercent>0?'+':''}{quote.changePercent.toFixed(2)}%</div></>:query.isError?<span className="text-xs text-neutral">시세 확인 불가</span>:<RefreshCw size={17} className="animate-spin text-primary"/>}
    </div>
    <div className="hidden px-4 pb-3 text-right text-[10px] text-neutral sm:block"><a href="https://upbit.com/exchange?code=CRIX.UPBIT.KRW-BTC" rel="noopener nofollow" target="_blank" className="text-primary hover:underline">상세 시세</a> by Upbit</div>
  </article>
}
