import {describe,expect,it} from 'vitest';
import {marketApiRequest} from '@5waveflow/market-data';
import {WALLPAPER_PRESETS} from '@5waveflow/wallpaper';

describe('wallpaper contracts',()=>{
  it('routes KRW through Upbit without changing the requested interval',()=>expect(marketApiRequest({symbol:'BTCKRW',interval:'5m'})).toEqual({symbol:'BTCUSDT',interval:'5m',market:'upbit'}));
  it('routes USDT pairs through the USDT provider chain',()=>expect(marketApiRequest({symbol:'ETHUSDT',interval:'1h'})).toEqual({symbol:'ETHUSDT',interval:'1h',market:'usdt'}));
  it('ships the three required presets',()=>expect(WALLPAPER_PRESETS.map(item=>item.id)).toEqual(['minimal','professional','ai']));
});
