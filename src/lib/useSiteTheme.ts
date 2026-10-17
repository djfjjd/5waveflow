import {useEffect,useState} from 'react';

export type ResolvedTheme='dark'|'light';
export const SITE_THEME_EVENT='5waveflow-theme-change';

function initialTheme():ResolvedTheme{
  const stored=localStorage.getItem('5waveflow-theme');
  if(stored==='dark'||stored==='light')return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
}

export function useSiteTheme(){
  const[theme,setTheme]=useState<ResolvedTheme>(initialTheme);
  useEffect(()=>{
    const update=(event:Event)=>setTheme((event as CustomEvent<ResolvedTheme>).detail);
    window.addEventListener(SITE_THEME_EVENT,update);
    const current=document.documentElement.dataset.theme;
    if(current==='light'||current==='dark')setTheme(current);
    return()=>window.removeEventListener(SITE_THEME_EVENT,update);
  },[]);
  return theme;
}
