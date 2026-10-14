import {describe,expect,it} from 'vitest';
import type {Candle} from '../types';
import {analyzeElliott,analyzeWyckoff,detectZigZag,evaluateAbc,evaluateImpulse} from './patterns';
import type {PivotType,ZigZagPivot} from './patterns/types';

describe('ATR adaptive ZigZag',()=>{
  it('detects alternating confirmed pivots and an optional developing pivot',()=>{const candles=waves([100,104,98,108,101,112,105]);const pivots=detectZigZag(candles,{atrPeriod:3,atrMultiplier:.5,depth:1});expect(pivots.length).toBeGreaterThanOrEqual(5);expect(pivots.slice(0,-1).every(value=>value.confirmed)).toBe(true);expect(pivots.every((value,index)=>index===0||value.type!==pivots[index-1].type)).toBe(true)});
  it('does not alter already confirmed pivots when future candles are appended',()=>{const base=waves([100,105,99,110,103,114]);const earlier=detectZigZag(base,{atrPeriod:3,atrMultiplier:.5,depth:1}).filter(value=>value.confirmed);const extended=detectZigZag([...base,...waves([106,116],base.length)],{atrPeriod:3,atrMultiplier:.5,depth:1}).filter(value=>value.confirmed&&value.index<base.length-1);expect(extended).toEqual(earlier.filter(value=>value.index<base.length-1))});
});

describe('Elliott rules',()=>{
  it('accepts a valid bullish impulse',()=>expect(evaluateImpulse(pivots([100,110,105,125,114,132],['low','high','low','high','low','high']))?.pattern).toBe('impulse'));
  it('rejects wave 2 crossing the wave 1 origin',()=>expect(evaluateImpulse(pivots([100,110,99,125,114,132],['low','high','low','high','low','high']))).toBeNull());
  it('rejects wave 4 overlap with wave 1 territory',()=>expect(evaluateImpulse(pivots([100,110,105,125,109,132],['low','high','low','high','low','high']))).toBeNull());
  it('detects an ABC correction candidate',()=>expect(evaluateAbc(pivots([130,110,122,100],['high','low','high','low']))?.label).toContain('A-B-C'));
  it('returns unavailable rather than inventing waves with insufficient data',()=>expect(analyzeElliott(waves([100,101,102])) .status).toBe('unavailable'));
});

describe('Wyckoff events',()=>{
  it('detects a Spring after support penetration and re-entry',()=>{const result=analyzeWyckoff([...flat(50),candle(50,100,101,98,100,160)]);expect(result.events.some(value=>value.type==='Spring')).toBe(true);expect(result.bias).toBe('accumulation')});
  it('detects an Upthrust after resistance penetration and re-entry',()=>{const result=analyzeWyckoff([...flat(50),candle(50,100,102,99,100,160)]);expect(result.events.some(value=>value.type==='Upthrust')).toBe(true);expect(result.bias).toBe('distribution')});
  it('keeps phase unavailable when evidence is insufficient',()=>expect(analyzeWyckoff(flat(55)).phase).toBeNull());
});

function pivots(prices:number[],types:PivotType[]):ZigZagPivot[]{return prices.map((price,index)=>({index,time:index,price,type:types[index],confirmed:true,atr:2}))}
function candle(time:number,open:number,high:number,low:number,close:number,volume=100):Candle{return{time,open,high,low,close,volume}}
function flat(count:number){return Array.from({length:count},(_,index)=>candle(index,100,101,99,100,100))}
function waves(points:number[],offset=0){const output:Candle[]=[];for(let segment=0;segment<points.length-1;segment++){for(let step=0;step<4;step++){const close=points[segment]+(points[segment+1]-points[segment])*step/4;output.push(candle(offset+output.length,close,close+.3,close-.3,close,100))}}output.push(candle(offset+output.length,points.at(-1)!,points.at(-1)!+.3,points.at(-1)!-.3,points.at(-1)!,100));return output}
