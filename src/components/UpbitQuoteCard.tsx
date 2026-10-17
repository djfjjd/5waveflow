import {useQuery} from '@tanstack/react-query';
import {ArrowDownRight,ArrowUpRight,RefreshCw} from 'lucide-react';

type Quote={symbol:string;price:number;changePercent:number;kimchiPremium:number|null;updatedAt:string};

async function getQuote(){
  const response=await fetch('/api/upbit',{signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error('Upbit quote unavailable');
  return response.json() as Promise<Quote>;
}

export default function UpbitQuoteCard(){
  const query=useQuery({queryKey:['quote','UPBIT:BTCKRW'],queryFn:getQuote,refetchInterval:15_000,staleTime:10_000});
  const quote=query.data;
  const up=(quote?.changePercent??0)>=0;
  return <article className="min-w-0 overflow-hidden bg-transparent">
    <div className="flex min-h-[82px] flex-col justify-center px-2 py-3 sm:min-h-[96px] sm:px-4">
      {quote?<><div className="whitespace-nowrap text-[9px] font-semibold tracking-tight tabular-nums sm:text-xl">비트코인/원 {Math.round(quote.price).toLocaleString('ko-KR')}원</div><div className="mt-2 flex items-center gap-2"><div className={`flex items-center gap-0.5 text-[10px] font-medium sm:gap-1 sm:text-sm ${up?'text-bullish':'text-bearish'}`}>{up?<ArrowUpRight className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5"/>:<ArrowDownRight className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5"/>} {quote.changePercent>0?'+':''}{quote.changePercent.toFixed(2)}%</div><span className={`shrink-0 whitespace-nowrap text-[8px] font-medium tabular-nums sm:text-xs ${(quote.kimchiPremium??0)>=0?'text-bullish':'text-bearish'}`}>김프 {quote.kimchiPremium==null?'—':`${quote.kimchiPremium>=0?'+':''}${quote.kimchiPremium.toFixed(2)}%`}</span></div></>:query.isError?<span className="text-xs text-neutral">시세 확인 불가</span>:<RefreshCw size={17} className="animate-spin text-primary"/>}
    </div>
  </article>
}
