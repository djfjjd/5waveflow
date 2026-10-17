export function appleShortcutShareUrl(value:string|undefined){
  if(!value)return null;
  try{const url=new URL(value.trim());return url.protocol==='https:'&&(url.hostname==='www.icloud.com'||url.hostname==='icloud.com')&&/^\/shortcuts\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)?url.toString():null}catch{return null}
}
