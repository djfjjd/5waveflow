import {describe,expect,it} from 'vitest';
import {parseRenderRequest} from './validate.js';

const valid={version:1,jobId:'993af7f4-9cc4-429a-8876-2a0c2ff05c77',projectId:'cb164507-9ebb-4de1-8d55-7d11d052324c',composition:'NewsShort',width:1080,height:1920,fps:30,durationSeconds:60,voice:'female',voiceSpeed:1.2,script:{hook:'뉴스',sections:[{title:'제목',text:'요약'}]},output:{format:'mp4'},callbackUrl:'https://5waveflow.pages.dev/api/video/webhook'};
describe('render request validation',()=>{
  it('accepts the Pages render contract',()=>expect(parseRenderRequest(valid)).toMatchObject({composition:'NewsShort',durationSeconds:60}));
  it('rejects unsupported dimensions and missing sections',()=>{expect(()=>parseRenderRequest({...valid,width:720})).toThrow('Unsupported');expect(()=>parseRenderRequest({...valid,script:{sections:[]}})).toThrow('Invalid script')});
});
