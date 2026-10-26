import {describe,expect,it} from 'vitest';
import {parseCoinnessPaste} from '../../functions/_shared/coinness-paste';
describe('Coinness page paste parser',()=>{it('drops navigation and sorts bulletin fields',()=>{const result=parseCoinnessPaste('홈\n실시간데이터\n09:30\nBTC ETF 승인 소식\n비트코인 시장이 반응했다\n#BTC\n좋아요 12\n댓글 3\n공유하기\n09:10\nETH 업데이트\n이더리움 네트워크 소식',new Date('2026-10-26T10:00:00+09:00'));expect(result).toHaveLength(2);expect(result[0]).toMatchObject({title:'BTC ETF 승인 소식',summary:'비트코인 시장이 반응했다',category:'crypto',assets:['BTC']});expect(JSON.stringify(result)).not.toContain('공유하기')})});
