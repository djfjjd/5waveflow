import { jsx as _jsx } from "react/jsx-runtime";
import { Composition } from 'remotion';
import { NewsShort } from './NewsShort.js';
const defaults = { hook: '최근 금융 뉴스를 정리합니다.', sections: [{ title: '오늘의 금융 뉴스', text: '5WaveFlow', startMs: 0, endMs: 60000 }], branding: '5WaveFlow', disclaimer: '투자 자문이 아닌 정보 제공 목적입니다.', captions: [] };
export const RemotionRoot = () => _jsx(Composition, { id: "NewsShort", component: NewsShort, width: 1080, height: 1920, fps: 30, durationInFrames: 1800, defaultProps: defaults });
