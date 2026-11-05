import {describe,expect,it} from 'vitest';
import {buildNarration,buildSilentTimeline} from './narration.js';

describe('video narration',()=>{
  it('keeps the integrated briefing sections within the selected duration',()=>{const sections=Array.from({length:5},(_,index)=>({title:`통합 브리핑 ${index+1}`,text:'시장 핵심 흐름과 영향 분석'}));const output=buildNarration('최근 뉴스를 하나로 정리했습니다.',sections,'투자 자문이 아닙니다.',60);expect(output.parts).toHaveLength(7);expect(output.text.length).toBeLessThanOrEqual(500);expect(output.text).toContain('5번째')});
  it('creates a silent caption timeline that fills the selected duration',()=>{const output=buildSilentTimeline('오늘의 뉴스',[{title:'첫 뉴스',text:'시장 변동성이 확대됐습니다.'},{title:'두 번째',text:'금리는 동결됐습니다.'}],'투자 자문이 아닙니다.',30);expect(output.sections[0].startMs).toBe(0);expect(output.sections.at(-1)?.endMs).toBe(30000);expect(output.captions.length).toBeGreaterThan(2);expect(output.captions.at(-1)?.endMs).toBe(30000)});
});
