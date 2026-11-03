import { describe, expect, it } from 'vitest';
import { buildNarration } from './narration.js';
describe('video narration', () => {
    it('keeps all headlines while bounding narration for the selected duration', () => { const sections = Array.from({ length: 20 }, (_, index) => ({ title: `${index + 1}번 매우 긴 금융 뉴스 제목과 시장 영향 설명`, text: '긴 분석 '.repeat(50) })); const output = buildNarration('최근 뉴스 20건입니다.', sections, '투자 자문이 아닙니다.', 60); expect(output.parts).toHaveLength(22); expect(output.text.length).toBeLessThanOrEqual(500); expect(output.text).toContain('20번째'); });
});
