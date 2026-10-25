import {json} from './social-publish';

export const MAX_MP4_BYTES=90*1024*1024;
interface StoredMedia {size:number;httpEtag:string;range?:{offset:number;length?:number}|{suffix:number};body:ReadableStream;writeHttpMetadata(headers:Headers):void}
interface MediaBucket {
  put(key:string,value:ReadableStream,options:{httpMetadata:{contentType:string;cacheControl:string};customMetadata:Record<string,string>}):Promise<unknown>;
  head(key:string):Promise<StoredMedia|null>;
  get(key:string,options:{range:Headers}):Promise<StoredMedia|null>;
}
export interface MediaEnv { SNS_MEDIA_BUCKET?:MediaBucket; SNS_MEDIA_SIGNING_SECRET?:string; SNS_MEDIA_URL_TTL_SECONDS?:string }

export async function validateMp4(file:File){
  if(file.size<16||file.size>MAX_MP4_BYTES)return `MP4 파일은 16바이트 이상 ${MAX_MP4_BYTES/1024/1024}MB 이하여야 합니다.`;
  if(file.type.toLowerCase()!=='video/mp4')return 'MIME 타입이 video/mp4인 파일만 업로드할 수 있습니다.';
  if(!file.name.toLowerCase().endsWith('.mp4'))return '확장자가 .mp4인 파일만 업로드할 수 있습니다.';
  const header=new Uint8Array(await file.slice(0,32).arrayBuffer());
  const boxSize=new DataView(header.buffer,header.byteOffset,header.byteLength).getUint32(0);
  const box=String.fromCharCode(...header.slice(4,8));
  const brand=String.fromCharCode(...header.slice(8,12));
  if(boxSize<16||boxSize>file.size||box!=='ftyp'||!validMp4Brand(brand))return '파일 내용이 유효한 MP4 컨테이너가 아닙니다.';
  return null;
}

export async function createSignedMediaUrl(origin:string,key:string,env:MediaEnv){
  if(!env.SNS_MEDIA_SIGNING_SECRET||env.SNS_MEDIA_SIGNING_SECRET.length<32)throw new Error('Media signing is not configured');
  const configured=Number(env.SNS_MEDIA_URL_TTL_SECONDS||86400);
  const ttl=Number.isFinite(configured)?Math.min(604800,Math.max(3600,Math.floor(configured))):86400;
  const expires=Math.floor(Date.now()/1000)+ttl;
  const signature=await sign(`${key}\n${expires}`,env.SNS_MEDIA_SIGNING_SECRET);
  return `${origin}/api/media/${key.split('/').map(encodeURIComponent).join('/')}?expires=${expires}&signature=${signature}`;
}

export async function verifySignedMediaUrl(key:string,expiresValue:string|null,signature:string|null,secret?:string){
  if(!secret||secret.length<32||!expiresValue||!signature)return false;
  const expires=Number(expiresValue),now=Math.floor(Date.now()/1000);
  if(!Number.isInteger(expires)||expires<now||expires>now+604800)return false;
  const expected=await sign(`${key}\n${expires}`,secret);
  return constantTimeEqual(signature,expected);
}

export function mediaError(message:string,status:number){return json({error:message},status)}
function validMp4Brand(brand:string){return /^(?:iso[2-9m]|mp4[12]|avc1|M4V |MSNV|dash)$/.test(brand)}
async function sign(value:string,secret:string){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));
  return toBase64Url(bytes);
}
function toBase64Url(bytes:Uint8Array){let value='';for(const byte of bytes)value+=String.fromCharCode(byte);return btoa(value).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function constantTimeEqual(a:string,b:string){let mismatch=a.length^b.length;for(let index=0;index<Math.max(a.length,b.length);index++)mismatch|=(a.charCodeAt(index)||0)^(b.charCodeAt(index)||0);return mismatch===0}
