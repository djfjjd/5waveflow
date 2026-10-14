export type PivotType='high'|'low';
export type ZigZagPivot={index:number;time:number;price:number;type:PivotType;confirmed:boolean;atr:number|null};
export type FibonacciLevels={retracement:number|null;extension:number|null};
export type ElliottScenario={pattern:'impulse'|'abc';direction:'bullish'|'bearish';status:'confirmed'|'developing';label:string;waveLabels:string[];pivotIndexes:number[];reasons:string[];counterReasons:string[];invalidationPrice:number;fibonacci:FibonacciLevels};
export type ElliottAnalysis={status:'confirmed'|'developing'|'unavailable';detail:string;pivots:ZigZagPivot[];scenarios:ElliottScenario[];analyzedAt:number|null};
export type WyckoffEventType='SC'|'BC'|'AR'|'ST'|'Spring'|'Upthrust'|'SOS'|'SOW'|'LPS'|'LPSY';
export type WyckoffEvent={type:WyckoffEventType;index:number;time:number;price:number;confirmed:boolean;reasons:string[]};
export type WyckoffAnalysis={status:'confirmed'|'developing'|'unavailable';detail:string;phase:'A'|'B'|'C'|'D'|'E'|null;bias:'accumulation'|'distribution'|'uncertain';support:number|null;resistance:number|null;events:WyckoffEvent[];reasons:string[];counterReasons:string[];analyzedAt:number|null};
