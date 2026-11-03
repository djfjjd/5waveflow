import type {Caption,NewsSection,TimedSection} from './types.js';

export function buildNarration(hook:string,sections:NewsSection[],disclaimer:string,durationSeconds:number){
  const fixedBudget=clean(hook).length+clean(disclaimer).length+sections.length*8,maxCharacters=Math.max(180,durationSeconds*7),perSection=Math.max(10,Math.floor((maxCharacters-fixedBudget)/Math.max(1,sections.length)));
  const parts=[shorten(clean(hook),50),...sections.map((section,index)=>`${index+1}번째. ${shorten(clean(section.title)||clean(section.text),perSection)}`),shorten(clean(disclaimer),55)].filter(Boolean);
  return {text:parts.join(' '),parts};
}

export function buildSilentTimeline(hook:string,sections:NewsSection[],disclaimer:string,durationSeconds:number){
  const items=[{title:'오늘의 금융 뉴스',text:shorten(clean(hook),70)},...sections.map((section,index)=>({title:clean(section.title)||`뉴스 ${index+1}`,text:shorten(clean(section.text)||clean(section.title),120)})),{title:'안내',text:shorten(clean(disclaimer),90)}].filter(item=>item.text);
  const totalMs=durationSeconds*1000,totalWeight=items.reduce((sum,item)=>sum+Math.max(20,item.text.length),0),timed:TimedSection[]=[];let cursor=0;
  items.forEach((item,index)=>{const remaining=totalMs-cursor,endMs=index===items.length-1?totalMs:Math.min(totalMs,cursor+Math.round(totalMs*Math.max(20,item.text.length)/totalWeight));timed.push({...item,startMs:cursor,endMs:Math.max(cursor+1,Math.min(totalMs,endMs))});cursor=Math.min(totalMs,endMs);if(remaining<=0)cursor=totalMs});
  const captions=timed.flatMap(section=>captionChunks(section.text||'',section.startMs,section.endMs));
  return {sections:timed,captions};
}

function captionChunks(text:string,startMs:number,endMs:number):Caption[]{
  const words=text.split(/\s+/).filter(Boolean),chunks:string[]=[];let current='';
  for(const word of words){const next=current?`${current} ${word}`:word;if(next.length>24&&current){chunks.push(current);current=word}else current=next}if(current)chunks.push(current);
  const totalWeight=chunks.reduce((sum,chunk)=>sum+chunk.length,0)||1;let cursor=startMs;
  return chunks.map((chunk,index)=>{const chunkEnd=index===chunks.length-1?endMs:Math.min(endMs,cursor+Math.round((endMs-startMs)*chunk.length/totalWeight)),caption={text:chunk,startMs:cursor,endMs:Math.max(cursor+1,chunkEnd),timestampMs:null,confidence:null};cursor=chunkEnd;return caption});
}

function clean(value:unknown){return typeof value==='string'?value.replace(/\s+/g,' ').trim():''}
function shorten(value:string,max:number){return value.length>max?`${value.slice(0,max-1)}…`:value}
