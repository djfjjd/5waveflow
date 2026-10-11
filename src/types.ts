export type Candle={time:number;open:number;high:number;low:number;close:number;volume:number};
export type Ticker={symbol:string;price:number;changePercent:number;volume:number;high:number;low:number;updatedAt:string};
export type IndicatorSnapshot={rsi:number|null;ema20:number|null;ema50:number|null;ema200:number|null;macd:number|null;signal:number|null;atr:number|null;bollinger:{upper:number;middle:number;lower:number}|null};
export type MarketPayload={symbol:string;interval:string;ticker:Ticker;candles:Candle[];indicators:IndicatorSnapshot;analysis:{elliott:{status:string;detail:string};wyckoff:{status:string;detail:string}};probability:null;probabilityStatus:'unavailable'|'experimental'};
