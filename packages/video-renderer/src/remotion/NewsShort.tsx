import React from 'react';
import {AbsoluteFill,Easing,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import type {NewsShortProps} from '../types.js';

export const NewsShort:React.FC<NewsShortProps>=({hook,sections,branding,disclaimer,captions})=>{
  const frame=useCurrentFrame(),{fps}=useVideoConfig(),timeMs=frame/fps*1000;
  const active=sections.find(section=>timeMs>=section.startMs&&timeMs<section.endMs)??sections.at(-1);
  const caption=captions.find(item=>timeMs>=item.startMs&&timeMs<item.endMs);
  const entrance=interpolate(frame%Math.max(1,Math.round(fps*3)),[0,8],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(0.16,1,0.3,1)});
  return <AbsoluteFill style={{backgroundColor:'#061323',color:'#f8fafc',fontFamily:'Arial, sans-serif',padding:'120px 84px 100px',overflow:'hidden'}}>
    <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 80% 12%, rgba(37,99,235,.45), transparent 35%), linear-gradient(160deg,#07182c 0%,#061323 55%,#0f2742 100%)'}} />
    <div style={{position:'relative',display:'flex',height:'100%',flexDirection:'column'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:34,fontWeight:700,color:'#93c5fd'}}><span>{branding}</span><span>FINANCE BRIEFING</span></div>
      <div style={{height:5,marginTop:28,background:'linear-gradient(90deg,#3b82f6,#22d3ee,transparent)',borderRadius:999}} />
      <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',opacity:entrance,translate:`0 ${interpolate(entrance,[0,1],[50,0])}px`}}>
        <div style={{fontSize:32,fontWeight:800,color:'#38bdf8',marginBottom:34}}>{active?.title||'오늘의 금융 뉴스'}</div>
        <div style={{fontSize:82,fontWeight:900,lineHeight:1.18,letterSpacing:-3,wordBreak:'keep-all'}}>{active?.text||hook}</div>
      </div>
      <div style={{minHeight:260,display:'flex',alignItems:'center',justifyContent:'center',padding:'38px 44px',background:'rgba(15,23,42,.82)',border:'2px solid rgba(96,165,250,.42)',borderRadius:32,fontSize:48,fontWeight:800,lineHeight:1.35,textAlign:'center',wordBreak:'keep-all'}}>{caption?.text||''}</div>
      <div style={{fontSize:25,color:'#94a3b8',marginTop:30,lineHeight:1.4}}>{disclaimer}</div>
    </div>
  </AbsoluteFill>;
};
