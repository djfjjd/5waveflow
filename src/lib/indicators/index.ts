import type {Candle,IndicatorSnapshot} from '../../types';
import {atr} from './atr';
import {bollingerBands,sma} from './bollinger';
import {ema,emaSeries} from './ema';
import {macd} from './macd';
import {rsi} from './rsi';
import {volumeMovingAverage} from './volume';

export {atr,bollingerBands,ema,emaSeries,macd,rsi,sma,volumeMovingAverage};

export function indicators(candles:Candle[]):IndicatorSnapshot{
  const closes=candles.map(candle=>candle.close);
  const volumes=candles.map(candle=>candle.volume);
  const macdResult=macd(closes);
  const volumeResult=volumeMovingAverage(volumes);
  return{
    rsi:rsi(closes),
    ema20:ema(closes,20),
    ema50:ema(closes,50),
    ema200:ema(closes,200),
    macd:macdResult?.line??null,
    signal:macdResult?.signal??null,
    macdHistogram:macdResult?.histogram??null,
    atr:atr(candles),
    bollinger:bollingerBands(closes),
    volumeMovingAverage:volumeResult?.movingAverage??null,
    volumeChangePercent:volumeResult?.changePercent??null
  };
}
