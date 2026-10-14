import {describe,expect,it} from 'vitest';
import type {Candle} from '../types';
import {atr,bollingerBands,ema,emaSeries,indicators,macd,rsi,sma,volumeMovingAverage} from './indicators';

describe('moving averages',()=>{
  it('calculates SMA from trailing values',()=>expect(sma([1,2,3,4],2)).toBe(3.5));
  it('creates an EMA series without future leakage',()=>{const values=emaSeries([1,2,3,4,5],3);expect(values).toHaveLength(5);expect(values.at(-1)).toBeCloseTo(4)});
  it('returns null when EMA data is insufficient',()=>expect(ema([1,2],3)).toBeNull());
});

describe('RSI 14',()=>{
  it('matches a Wilder smoothing fixture',()=>{const closes=[44.34,44.09,44.15,43.61,44.33,44.83,45.1,45.42,45.84,46.08,45.89,46.03,45.61,46.28,46.28,46,46.03,46.41,46.22,45.64,46.21,46.25,45.71,46.45,45.78,45.35,44.03,44.18,44.22,44.57,43.42,42.66,43.13];expect(rsi(closes,14)).toBeCloseTo(37.79,1)});
  it('returns 100 for uninterrupted gains',()=>expect(rsi(Array.from({length:16},(_,index)=>index+1),14)).toBe(100));
  it('returns null for insufficient input',()=>expect(rsi([1,2],14)).toBeNull());
});

describe('MACD 12,26,9',()=>{
  it('is zero for a constant price series',()=>expect(macd(Array(40).fill(100))).toEqual({line:0,signal:0,histogram:0}));
  it('requires enough prices for the signal line',()=>expect(macd(Array(33).fill(100))).toBeNull());
});

describe('Bollinger Bands 20,2',()=>{
  it('uses population standard deviation over the latest window',()=>{const bands=bollingerBands(Array.from({length:20},(_,index)=>index+1))!;expect(bands.middle).toBe(10.5);expect(bands.upper).toBeCloseTo(22.03256,4);expect(bands.lower).toBeCloseTo(-1.03256,4)});
  it('returns null for insufficient prices',()=>expect(bollingerBands([1,2,3])).toBeNull());
});

describe('ATR 14',()=>{
  it('applies Wilder smoothing to true ranges',()=>expect(atr(makeCandles(20),14)).toBeCloseTo(2));
  it('returns null for insufficient candles',()=>expect(atr(makeCandles(14),14)).toBeNull());
});

describe('volume moving average',()=>{
  it('compares latest volume with the preceding average',()=>expect(volumeMovingAverage([...Array(20).fill(100),150],20)).toEqual({movingAverage:100,changePercent:50}));
  it('returns null for insufficient volumes',()=>expect(volumeMovingAverage([100],20)).toBeNull());
});

describe('indicator snapshot',()=>{
  it('never invents values when candles are insufficient',()=>expect(indicators(makeCandles(10))).toMatchObject({rsi:null,ema20:null,ema50:null,ema200:null,macd:null,signal:null,macdHistogram:null,atr:null,bollinger:null,volumeMovingAverage:null,volumeChangePercent:null}));
});

function makeCandles(count:number):Candle[]{return Array.from({length:count},(_,index)=>({time:index,open:100+index,high:101+index,low:99+index,close:100+index,volume:100}))}
