export const MARKET_SYMBOLS=['BTCUSDT','BTCKRW','ETHUSDT'] as const;
export const MARKET_INTERVALS=['1m','5m','15m','1h','4h','1d'] as const;
export type MarketSymbol=typeof MARKET_SYMBOLS[number];
export type MarketInterval=typeof MARKET_INTERVALS[number];
export type ConnectionStatus='connected'|'stale'|'disconnected';
export type MarketCandle={time:number;open:number;high:number;low:number;close:number;volume:number};
export type MarketQuote={symbol:MarketSymbol;price:number;changePercent:number;volume:number;updatedAt:string;provider:string;quoteCurrency:'USDT'|'KRW';status:ConnectionStatus;candles:MarketCandle[]};
export type MarketRequest={symbol:MarketSymbol;interval:MarketInterval};

export function marketApiRequest(request:MarketRequest){
  if(request.symbol==='BTCKRW')return{symbol:'BTCUSDT',interval:request.interval,market:'upbit' as const};
  return{symbol:request.symbol,interval:request.interval,market:'usdt' as const};
}
