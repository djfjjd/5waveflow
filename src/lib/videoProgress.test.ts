import {describe,expect,it} from 'vitest';
import {videoProgress} from './videoProgress';

describe('video render progress',()=>{
  it('maps renderer stages without reporting completion early',()=>{expect(videoProgress('queued')).toBe(10);expect(videoProgress('generating_script')).toBe(35);expect(videoProgress('generating_audio')).toBe(55);expect(videoProgress('rendering')).toBe(80);expect(videoProgress('completed')).toBe(100)});
  it('does not invent progress for failed or unknown stages',()=>{expect(videoProgress('failed')).toBe(0);expect(videoProgress('unknown')).toBe(0)});
});
