import type {MarketPayload} from '../types';
const base=import.meta.env.VITE_API_BASE_URL||'';
export async function getMarket(symbol:string,interval:string){const r=await fetch(`${base}/api/market?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}`,{signal:AbortSignal.timeout(10_000)});if(!r.ok){const b=await r.json().catch(()=>({error:'Market data unavailable'})) as {error?:string};throw new Error(b.error||'Market data unavailable')}return r.json() as Promise<MarketPayload>}
