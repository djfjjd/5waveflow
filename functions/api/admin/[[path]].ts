interface Env { CF_ACCESS_TEAM_DOMAIN?:string; CF_ACCESS_AUD?:string; DB?:D1Database; SNS_PUBLISH_WEBHOOK_URL?:string; SNS_PUBLISH_WEBHOOK_TOKEN?:string }
type Claims={aud?:string[]|string;exp?:number;iss?:string};
type Jwk={kid?:string;kty:string;n?:string;e?:string;alg?:string;use?:string};
const supportedPlatforms=['instagram','youtube','tiktok','x','threads'] as const;
type Platform=typeof supportedPlatforms[number];

export const onRequest:PagesFunction<Env>=async({request,env})=>{
  if(!env.CF_ACCESS_TEAM_DOMAIN||!env.CF_ACCESS_AUD) return response({error:'Admin access is not configured'},503);
  const jwt=request.headers.get('Cf-Access-Jwt-Assertion');
  if(!jwt) return response({error:'Unauthorized'},401);
  try {
    const teamDomain=normalizeDomain(env.CF_ACCESS_TEAM_DOMAIN);
    const claims=await verifyAccessJwt(jwt,teamDomain,env.CF_ACCESS_AUD);
    const path=new URL(request.url).pathname.replace(/^\/api\/admin\/?/,'');
    if(path==='publish'&&request.method==='POST') return publish(request,env,claims);
    if(path==='publish') return response({error:'Method not allowed'},405,{Allow:'POST'});
    return response({ok:true,message:'Admin API foundation',databaseBound:Boolean(env.DB),identityVerified:true,expiresAt:claims.exp});
  } catch(reason) {
    if(reason instanceof Response)return reason;
    return response({error:'Unauthorized'},401);
  }
};

async function publish(request:Request,env:Env,claims:Claims){
  if(!env.SNS_PUBLISH_WEBHOOK_URL||!env.SNS_PUBLISH_WEBHOOK_TOKEN)return response({error:'SNS 발행 Webhook이 설정되지 않았습니다. 관리자에게 문의하세요.'},503);
  const webhookUrl=safeWebhookUrl(env.SNS_PUBLISH_WEBHOOK_URL);
  if(!webhookUrl)return response({error:'SNS 발행 Webhook URL 설정이 올바르지 않습니다.'},503);
  const input=await request.json().catch(()=>null) as {platforms?:unknown;mediaUrl?:unknown;title?:unknown;caption?:unknown}|null;
  if(!input||!Array.isArray(input.platforms)||typeof input.mediaUrl!=='string'||typeof input.title!=='string'||typeof input.caption!=='string')return response({error:'필수 게시 정보를 확인해 주세요.'},400);
  const platforms=[...new Set(input.platforms)].filter((value):value is Platform=>typeof value==='string'&&supportedPlatforms.includes(value as Platform));
  let mediaUrl:URL;
  try{mediaUrl=new URL(input.mediaUrl)}catch{return response({error:'올바른 미디어 URL을 입력해 주세요.'},400)}
  if(mediaUrl.protocol!=='https:'||!platforms.length||input.title.trim().length<1||input.title.length>100||input.caption.trim().length<1||input.caption.length>2200)return response({error:'게시 정보 또는 선택한 플랫폼을 확인해 주세요.'},400);
  const jobId=crypto.randomUUID();
  const upstream=await fetch(webhookUrl,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${env.SNS_PUBLISH_WEBHOOK_TOKEN}`,'x-idempotency-key':jobId},body:JSON.stringify({jobId,platforms,mediaUrl:mediaUrl.toString(),title:input.title.trim(),caption:input.caption.trim(),requestedAt:new Date().toISOString(),adminTokenExpiresAt:claims.exp}),signal:AbortSignal.timeout(25_000)}).catch(()=>null);
  if(!upstream)return response({error:'SNS 발행 서비스에 연결할 수 없습니다.'},502);
  if(!upstream.ok){const detail=await upstream.text().catch(()=>'');return response({error:'SNS 발행 서비스가 요청을 거절했습니다.',detail:detail.slice(0,300)},502)}
  return response({ok:true,jobId,platforms,message:'선택한 SNS 채널로 업로드 요청을 전송했습니다.'},202);
}

function safeWebhookUrl(value:string){try{const url=new URL(value);return url.protocol==='https:'?url.toString():null}catch{return null}}
async function verifyAccessJwt(token:string,teamDomain:string,expectedAud:string){
  const parts=token.split('.');
  if(parts.length!==3) throw new Error('Malformed token');
  const header=JSON.parse(decode(parts[0])) as {alg?:string;kid?:string};
  const claims=JSON.parse(decode(parts[1])) as Claims;
  if(header.alg!=='RS256'||!header.kid) throw new Error('Unsupported token');
  const certsResponse=await fetch(`https://${teamDomain}/cdn-cgi/access/certs`,{headers:{accept:'application/json'},signal:AbortSignal.timeout(5000)});
  if(!certsResponse.ok) throw new Error('JWKS unavailable');
  const certs=await certsResponse.json() as {keys:Jwk[]};
  const jwk=certs.keys.find(key=>key.kid===header.kid);
  if(!jwk) throw new Error('Signing key not found');
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,bytes(parts[2]),new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  const aud=Array.isArray(claims.aud)?claims.aud:[claims.aud];
  if(!valid||!aud.includes(expectedAud)||!claims.exp||claims.exp*1000<Date.now()||claims.iss!==`https://${teamDomain}`) throw new Error('Invalid claims');
  return claims;
}
function normalizeDomain(value:string){return value.replace(/^https?:\/\//,'').replace(/\/$/,'')}
function decode(value:string){return new TextDecoder().decode(bytes(value))}
function bytes(value:string){const normalized=value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=');return Uint8Array.from(atob(normalized),c=>c.charCodeAt(0))}
function response(body:unknown,status=200,extraHeaders:Record<string,string>={}){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extraHeaders}})}
