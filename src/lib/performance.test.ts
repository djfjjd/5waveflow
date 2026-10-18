import {afterEach,describe,expect,it,vi} from 'vitest';
import {getPerformance} from './api';
import {actualDirection,buildBacktest,closedCandles,predictedDirection,selectValidationTargets,summarizePerformance,type PerformanceResult} from './performance';
import type {Candle} from '../types';

function candles(count:number):Candle[]{return Array.from({length:count},(_,index)=>{const close=100+index*.2+Math.sin(index/4);return{time:index*900,open:close-.1,high:close+.6,low:close-.6,close,volume:1000+index}})}

describe('performance backtest',()=>{
  afterEach(()=>vi.unstubAllGlobals());
  it('excludes the currently open candle at its interval boundary',()=>expect(closedCandles(candles(3),'15m',2*900*1000)).toHaveLength(2));
  it('selects only the latest 30 validation targets',()=>expect(selectValidationTargets(candles(50))).toEqual(Array.from({length:30},(_,index)=>index+20)));
  it('does not create results without indicator history',()=>expect(buildBacktest('BTCUSDT','15m',candles(100))).toHaveLength(0));
  it('uses only prior candles for each target',()=>{const source=candles(240),before=buildBacktest('BTCUSDT','15m',source),changed=source.map((value,index)=>index===239?{...value,close:value.close*2}:value),after=buildBacktest('BTCUSDT','15m',changed);expect(before.at(-1)?.scores).toEqual(after.at(-1)?.scores);expect(before.at(-1)?.actualDirection).not.toEqual(after.at(-1)?.actualDirection)});
  it('applies the sideways direction threshold',()=>{expect(actualDirection(.05,.1)).toBe('sideways');expect(actualDirection(.2,.1)).toBe('bullish');expect(actualDirection(-.2,.1)).toBe('bearish')});
  it('resolves score ties without inventing randomness',()=>expect(predictedDirection({bullish:34,sideways:34,bearish:32})).toBe('sideways'));
  it('calculates win rate and multiclass Brier score',()=>{const base={id:'x',symbol:'BTCUSDT',interval:'15m',recordKind:'backtest',predictionTime:'2026-01-01',targetTime:'2026-01-02',predictionPrice:100,observedPrice:101,returnPercent:1,sidewaysThresholdPercent:.1,modelVersion:'v'} as const;const rows=[{...base,scores:{bullish:60,sideways:20,bearish:20},predictedDirection:'bullish',actualDirection:'bullish',hit:true},{...base,id:'y',scores:{bullish:20,sideways:20,bearish:60},predictedDirection:'bearish',actualDirection:'sideways',hit:false}] satisfies PerformanceResult[];const summary=summarizePerformance(rows);expect(summary.winRate).toBe(50);expect(summary.byDirection.bullish.winRate).toBe(100);expect(summary.brierScore).toBeCloseTo(.64)});
  it('keeps backtest records explicitly separated from live records',()=>expect(buildBacktest('BTCUSDT','15m',candles(240)).every(value=>value.recordKind==='backtest')).toBe(true));
  it('reports provider API errors without creating fallback results',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({error:'Performance data unavailable',detail:'provider offline'}),{status:502,headers:{'content-type':'application/json'}})));await expect(getPerformance('15m')).rejects.toThrow('provider offline')});
});
