import {describe,expect,it} from 'vitest';
import {hasValidBearer,parsePublishRequest,safeTarget} from '../../functions/_shared/social-publish';

const secret='test-secret-that-is-at-least-32-characters';

describe('SNS publish contract',()=>{
  it('rejects current Pages origin and known publish endpoints',()=>{
    expect(safeTarget('https://5waveflow.pages.dev/api/elsewhere','https://5waveflow.pages.dev/api/admin/publish')).toBeNull();
    expect(safeTarget('https://custom.example/api/sns/webhook','https://5waveflow.pages.dev/api/admin/publish')).toBeNull();
    expect(safeTarget('https://publisher.example/hooks/social','https://5waveflow.pages.dev/api/admin/publish')).toBe('https://publisher.example/hooks/social');
  });

  it('validates the webhook bearer token',async()=>{
    expect(await hasValidBearer(new Request('https://example.com',{headers:{authorization:`Bearer ${secret}`}}),secret)).toBe(true);
    expect(await hasValidBearer(new Request('https://example.com',{headers:{authorization:'Bearer wrong-token'}}),secret)).toBe(false);
    expect(await hasValidBearer(new Request('https://example.com'),secret)).toBe(false);
  });

  it('normalizes a valid publish request',async()=>{
    const request=new Request('https://example.com',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({platforms:['instagram','instagram','unknown'],mediaUrl:'https://cdn.example.com/video.mp4',title:' Title ',caption:' Caption '})});
    const result=await parsePublishRequest(request,'job-1');
    expect(result).toMatchObject({jobId:'job-1',platforms:['instagram'],mediaUrl:'https://cdn.example.com/video.mp4',title:'Title',caption:'Caption'});
  });
});
