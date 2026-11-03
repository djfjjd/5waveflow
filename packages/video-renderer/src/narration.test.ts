import {describe,expect,it} from 'vitest';
import {buildNarration,buildSilentTimeline} from './narration.js';

describe('video narration',()=>{
  it('keeps all headlines while bounding narration for the selected duration',()=>{const sections=Array.from({length:20},(_,index)=>({title:`${index+1}번 매우 긴 금융 뉴스 제목과 시장 영향 설명`,text:'긴 분석 '.repeat(50)}));const output=buildNarration('최근 뉴스 20건입니다.',sections,'투자 자문이 아닙니다.',60);expect(output.parts).toHaveLength(22);expect(output.text.length).toBeLessThanOrEqual(500);expect(output.text).toContain('20번째')});
  it('creates a silent caption timeline that fills the selected duration',()=>{const output=buildSilentTimeline('오늘의 뉴스',[{title:'첫 뉴스',text:'시장 변동성이 확대됐습니다.'},{title:'두 번째',text:'금리는 동결됐습니다.'}],'투자 자문이 아닙니다.',30);expect(output.sections[0].startMs).toBe(0);expect(output.sections.at(-1)?.endMs).toBe(30000);expect(output.captions.length).toBeGreaterThan(2);expect(output.captions.at(-1)?.endMs).toBe(30000)});
});
