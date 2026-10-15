import {describe,expect,it} from 'vitest';
import {marketApiRequest,wallpaperImagePath} from '@5waveflow/market-data';
import {WALLPAPER_PRESETS} from '@5waveflow/wallpaper';
import {scenarioScores} from './scenarioScores';
import type {MarketPayload} from '../types';

describe('wallpaper contracts',()=>{
  it('routes KRW through Upbit without changing the requested interval',()=>expect(marketApiRequest({symbol:'BTCKRW',interval:'5m'})).toEqual({symbol:'BTCUSDT',interval:'5m',market:'upbit'}));
  it('routes USDT pairs through the USDT provider chain',()=>expect(marketApiRequest({symbol:'ETHUSDT',interval:'1h'})).toEqual({symbol:'ETHUSDT',interval:'1h',market:'usdt'}));
  it('ships the three required presets',()=>expect(WALLPAPER_PRESETS.map(item=>item.id)).toEqual(['minimal','professional','ai']));
  it('keeps direction values at exactly 100 percent',()=>{const market={indicators:{rsi:60,macd:2,signal:1,ema20:3,ema50:2,ema200:1,volumeChangePercent:20}} as unknown as MarketPayload;const scores=scenarioScores(market);expect(scores.bullish+scores.sideways+scores.bearish).toBe(100)});
  it('builds a bounded iOS shortcut image URL',()=>expect(wallpaperImagePath({symbol:'ETHUSDT',interval:'15m',theme:'dark',refreshMinutes:99})).toBe('/api/wallpaper?symbol=ETHUSDT&interval=15m&theme=dark&refresh=60'));
});
