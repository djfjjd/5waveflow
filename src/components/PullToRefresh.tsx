import {ArrowDown,RefreshCw} from 'lucide-react';
import {useEffect,useRef,useState} from 'react';

const THRESHOLD=72;
const MAX_PULL=112;

export default function PullToRefresh(){
  const startY=useRef<number|null>(null);
  const pulling=useRef(false);
  const distanceRef=useRef(0);
  const[distance,setDistance]=useState(0);
  const[refreshing,setRefreshing]=useState(false);

  useEffect(()=>{
    const supportsTouch=navigator.maxTouchPoints>0||'ontouchstart' in window;
    if(!supportsTouch)return;
    const reset=()=>{startY.current=null;pulling.current=false;distanceRef.current=0;setDistance(0)};
    const onStart=(event:TouchEvent)=>{if(window.scrollY!==0||event.touches.length!==1)return;startY.current=event.touches[0].clientY;pulling.current=true};
    const onMove=(event:TouchEvent)=>{if(!pulling.current||startY.current===null||event.touches.length!==1)return;const raw=event.touches[0].clientY-startY.current;if(raw<=0){reset();return}const next=Math.min(MAX_PULL,raw*.55);distanceRef.current=next;setDistance(next);event.preventDefault()};
    const onEnd=()=>{if(!pulling.current)return;if(distanceRef.current>=THRESHOLD){setRefreshing(true);window.location.reload();return}reset()};
    window.addEventListener('touchstart',onStart,{passive:true});
    window.addEventListener('touchmove',onMove,{passive:false});
    window.addEventListener('touchend',onEnd,{passive:true});
    window.addEventListener('touchcancel',reset,{passive:true});
    return()=>{window.removeEventListener('touchstart',onStart);window.removeEventListener('touchmove',onMove);window.removeEventListener('touchend',onEnd);window.removeEventListener('touchcancel',reset)};
  },[]);

  const visible=distance>2||refreshing;
  const ready=distance>=THRESHOLD;
  return <div aria-live="polite" className={`pointer-events-none fixed left-1/2 top-2 z-[70] -translate-x-1/2 transition-opacity duration-150 md:hidden ${visible?'opacity-100':'opacity-0'}`} style={{transform:`translate(-50%, ${Math.max(0,distance-18)}px)`}}><div className="flex items-center gap-2 rounded-full border border-[#334050] bg-surface/95 px-3 py-2 text-xs text-neutral shadow-xl backdrop-blur">{refreshing?<RefreshCw size={15} className="animate-spin text-primary"/>:<ArrowDown size={15} className={`text-primary transition-transform ${ready?'rotate-180':''}`}/>}<span>{refreshing?'새로고침 중…':ready?'놓아서 새로고침':'아래로 당겨 새로고침'}</span></div></div>
}
