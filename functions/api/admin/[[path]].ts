interface Env { CF_ACCESS_TEAM_DOMAIN?:string; CF_ACCESS_AUD?:string; DB:D1Database }
type Claims={aud?:string[]|string;exp?:number;iss?:string};
type Jwk={kid?:string;kty:string;n?:string;e?:string;alg?:string;use?:string};

export const onRequest:PagesFunction<Env>=async({request,env})=>{
  if(!env.CF_ACCESS_TEAM_DOMAIN||!env.CF_ACCESS_AUD) return response({error:'Admin access is not configured'},503);
  const jwt=request.headers.get('Cf-Access-Jwt-Assertion');
  if(!jwt) return response({error:'Unauthorized'},401);
  try {
    const teamDomain=normalizeDomain(env.CF_ACCESS_TEAM_DOMAIN);
    const claims=await verifyAccessJwt(jwt,teamDomain,env.CF_ACCESS_AUD);
    return response({ok:true,message:'Admin API foundation',databaseBound:Boolean(env.DB),identityVerified:true,expiresAt:claims.exp});
  } catch {
    return response({error:'Unauthorized'},401);
  }
};

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
function response(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
