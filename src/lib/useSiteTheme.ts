import {useEffect,useState} from 'react';

export type ResolvedTheme='dark'|'light';
export const SITE_THEME_EVENT='5waveflow-theme-change';

export function useSiteTheme(){
  const[theme,setTheme]=useState<ResolvedTheme>(()=>document.documentElement.dataset.theme==='light'?'light':'dark');
  useEffect(()=>{
    const update=(event:Event)=>setTheme((event as CustomEvent<ResolvedTheme>).detail);
    window.addEventListener(SITE_THEME_EVENT,update);
    const current=document.documentElement.dataset.theme;
    if(current==='light'||current==='dark')setTheme(current);
    return()=>window.removeEventListener(SITE_THEME_EVENT,update);
  },[]);
  return theme;
}
