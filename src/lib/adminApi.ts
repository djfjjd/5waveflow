const key='5waveflow-admin-token';
export function getAdminToken(){return sessionStorage.getItem(key)||''}
export function setAdminToken(value:string){if(value)sessionStorage.setItem(key,value);else sessionStorage.removeItem(key)}
export function adminFetch(input:RequestInfo|URL,init:RequestInit={}){const headers=new Headers(init.headers),token=getAdminToken();if(token)headers.set('x-admin-token',token);return fetch(input,{...init,headers})}
