import {describe,expect,it} from 'vitest';
import {createSignedMediaUrl,isAdminUploadedMediaKey,validateMp4,verifySignedMediaUrl} from '../../functions/_shared/media';

const secret='media-signing-secret-at-least-32-characters';

describe('private SNS media',()=>{
  it('accepts an MP4 signature and rejects disguised files',async()=>{
    const valid=new File([new Uint8Array([0,0,0,16,102,116,121,112,105,115,111,109,0,0,0,0])],'clip.mp4',{type:'video/mp4'});
    const invalid=new File([new TextEncoder().encode('this is not an mp4 file')],'clip.mp4',{type:'video/mp4'});
    expect(await validateMp4(valid)).toBeNull();
    expect(await validateMp4(invalid)).toContain('유효한 MP4');
  });

  it('creates a verifiable expiring media URL',async()=>{
    const url=new URL(await createSignedMediaUrl('https://5waveflow.pages.dev','sns/2026/10/video.mp4',{SNS_MEDIA_SIGNING_SECRET:secret,SNS_MEDIA_URL_TTL_SECONDS:'3600'}));
    expect(await verifySignedMediaUrl('sns/2026/10/video.mp4',url.searchParams.get('expires'),url.searchParams.get('signature'),secret)).toBe(true);
    expect(await verifySignedMediaUrl('sns/2026/10/other.mp4',url.searchParams.get('expires'),url.searchParams.get('signature'),secret)).toBe(false);
  });

  it('only accepts media keys created by the admin MP4 uploader',()=>{
    expect(isAdminUploadedMediaKey('sns/2026/11/550e8400-e29b-41d4-a716-446655440000.mp4')).toBe(true);
    expect(isAdminUploadedMediaKey('../private/video.mp4')).toBe(false);
    expect(isAdminUploadedMediaKey('renders/completed.mp4')).toBe(false);
  });
});
