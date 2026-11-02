import {describe,expect,it} from 'vitest';
import {estimatedVideoProgress,isRenderCallbackDelayed,videoProgress} from './videoProgress';

describe('video render progress',()=>{
  it('maps renderer stages without reporting completion early',()=>{expect(videoProgress('queued')).toBe(10);expect(videoProgress('generating_script')).toBe(35);expect(videoProgress('generating_audio')).toBe(55);expect(videoProgress('rendering')).toBe(80);expect(videoProgress('completed')).toBe(100)});
  it('does not invent progress for failed or unknown stages',()=>{expect(videoProgress('failed')).toBe(0);expect(videoProgress('unknown')).toBe(0)});
  it('only advances when the renderer reports an actual stage',()=>{const updated='2026-11-02T00:00:00.000Z';expect(estimatedVideoProgress('generating_script',updated,Date.parse('2026-11-02T00:00:40.000Z'))).toBe(35);expect(estimatedVideoProgress('generating_script',updated,Date.parse('2026-11-02T01:00:00.000Z'))).toBe(35);expect(estimatedVideoProgress('completed',updated,Date.parse('2026-11-02T01:00:00.000Z'))).toBe(100)});
  it('detects a missing renderer callback after five minutes',()=>{const updated='2026-11-02 00:00:00';expect(isRenderCallbackDelayed('rendering',updated,Date.parse('2026-11-02T00:04:59.000Z'))).toBe(false);expect(isRenderCallbackDelayed('rendering',updated,Date.parse('2026-11-02T00:05:00.000Z'))).toBe(true)});
});
