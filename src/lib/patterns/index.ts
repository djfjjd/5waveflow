import type {Candle} from '../../types';
import {analyzeElliott} from './elliott';
import {analyzeWyckoff} from './wyckoff';

export {analyzeElliott,evaluateAbc,evaluateImpulse} from './elliott';
export {analyzeWyckoff} from './wyckoff';
export {detectZigZag} from './zigzag';
export type * from './types';

export function analyzePatterns(candles:Candle[]){return{elliott:analyzeElliott(candles),wyckoff:analyzeWyckoff(candles)}}
