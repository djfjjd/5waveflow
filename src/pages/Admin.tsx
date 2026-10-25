import {FormEvent,useEffect,useState} from 'react';
import {Activity,CheckCircle2,Database,Film,Link2,Loader2,LockKeyhole,RadioTower,Send,Settings2,Share2,Upload} from 'lucide-react';
import {Link,useLocation} from 'react-router-dom';
import VideoStudio from '../components/VideoStudio';
import News from './News';

const platforms=['instagram','youtube','tiktok','x','threads'] as const;
type Platform=typeof platforms[number];
type PublishResult={ok:boolean;jobId:string;message:string;platforms:Platform[]};
type UploadResult={ok:boolean;mediaUrl:string;size:number;expiresIn:number};
const platformLabels:Record<Platform,string>={instagram:'Instagram',youtube:'YouTube',tiktok:'TikTok',x:'X',threads:'Threads'};

function PublishPanel(){
  const [selected,setSelected]=useState<Platform[]>(['instagram','youtube','tiktok','x','threads']);
  const [mediaUrl,setMediaUrl]=useState('');
  const [file,setFile]=useState<File|null>(null);
  const [previewUrl,setPreviewUrl]=useState('');
  const [uploadProgress,setUploadProgress]=useState<number|null>(null);
  const [uploading,setUploading]=useState(false);
  const [title,setTitle]=useState('');
  const [caption,setCaption]=useState('');
  const [submitting,setSubmitting]=useState(false);
  const [result,setResult]=useState<PublishResult|null>(null);
  const [error,setError]=useState('');
  const [idempotencyKey,setIdempotencyKey]=useState(()=>crypto.randomUUID());
  useEffect(()=>{if(!file){setPreviewUrl('');return}const url=URL.createObjectURL(file);setPreviewUrl(url);return()=>URL.revokeObjectURL(url)},[file]);
  const toggle=(platform:Platform)=>setSelected(current=>current.includes(platform)?current.filter(item=>item!==platform):[...current,platform]);
  const upload=()=>{
    if(!file)return;
    setError('');setUploading(true);setUploadProgress(0);
    const data=new FormData();data.append('file',file);
    const xhr=new XMLHttpRequest();xhr.open('POST','/api/admin/media');xhr.responseType='json';
    xhr.upload.onprogress=event=>{if(event.lengthComputable)setUploadProgress(Math.round(event.loaded/event.total*100))};
    xhr.onload=()=>{const body=xhr.response as Partial<UploadResult>&{error?:string};if(xhr.status>=200&&xhr.status<300&&body.mediaUrl){setMediaUrl(body.mediaUrl);setUploadProgress(100)}else setError(body?.error||'영상 업로드에 실패했습니다.');setUploading(false)};
    xhr.onerror=()=>{setError('영상 업로드 중 네트워크 오류가 발생했습니다.');setUploading(false)};
    xhr.send(data);
  };
  const submit=async(event:FormEvent)=>{
    event.preventDefault();setError('');setResult(null);
    if(!selected.length){setError('게시할 플랫폼을 하나 이상 선택해 주세요.');return}
    setSubmitting(true);
    try{
      const response=await fetch('/api/admin/publish',{method:'POST',headers:{'content-type':'application/json','x-idempotency-key':idempotencyKey},body:JSON.stringify({platforms:selected,mediaUrl,title,caption})});
      const body=await response.json().catch(()=>({})) as Partial<PublishResult>&{error?:string};
      if(!response.ok)throw new Error(body.error||'게시 요청에 실패했습니다.');
      setResult(body as PublishResult);setIdempotencyKey(crypto.randomUUID());
    }catch(reason){setError(reason instanceof Error?reason.message:'게시 요청에 실패했습니다.')}finally{setSubmitting(false)}
  };
  return <div className="card p-6">
    <div className="flex items-center gap-2"><Share2 size={18} className="text-primary"/><h2 className="font-semibold">SNS 원클릭 업로드</h2></div>
    <p className="mt-3 text-sm leading-6 text-neutral">MP4를 비공개 저장소에 업로드하거나 외부 미디어 URL을 입력한 뒤 선택한 채널로 발행 요청을 보냅니다.</p>
    <form className="mt-6 space-y-5" onSubmit={submit}>
      <fieldset><legend className="mb-2 text-sm font-medium">게시 채널</legend><div className="flex flex-wrap gap-2">{platforms.map(platform=><button className={`focus-ring rounded-full border px-3 py-2 text-sm transition ${selected.includes(platform)?'border-primary bg-primary/10 text-primary':'border-[#354151] text-neutral'}`} type="button" aria-pressed={selected.includes(platform)} onClick={()=>toggle(platform)} key={platform}>{selected.includes(platform)&&<CheckCircle2 className="mr-1.5 inline" size={15}/>} {platformLabels[platform]}</button>)}</div></fieldset>
      <div><label className="mb-2 block text-sm font-medium" htmlFor="sns-video">MP4 파일 업로드</label><div className="flex flex-col gap-3 sm:flex-row"><input id="sns-video" className="focus-ring min-w-0 flex-1 rounded-lg border border-[#354151] bg-background p-2 text-sm" type="file" accept="video/mp4,.mp4" onChange={event=>setFile(event.target.files?.[0]||null)}/><button className="focus-ring flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm text-primary disabled:opacity-50" type="button" disabled={!file||uploading} onClick={upload}>{uploading?<Loader2 className="animate-spin" size={17}/>:<Upload size={17}/>} R2에 업로드</button></div>{uploadProgress!==null&&<div className="mt-3"><div className="h-2 overflow-hidden rounded-full bg-[#26303d]"><div className="h-full bg-primary transition-all" style={{width:`${uploadProgress}%`}}/></div><div className="mt-1 text-right text-xs text-neutral">{uploadProgress}%</div></div>}{previewUrl&&<video className="mt-3 max-h-72 w-full rounded-lg bg-black" controls preload="metadata" src={previewUrl}/>}<span className="mt-1.5 block text-xs text-neutral">video/mp4 형식, 최대 90MB. 업로드 후 아래 서명 URL이 자동 입력됩니다.</span></div>
      <label className="block"><span className="mb-2 block text-sm font-medium">미디어 URL</span><div className="relative"><Link2 className="absolute left-3 top-3 text-neutral" size={17}/><input className="focus-ring w-full rounded-lg border border-[#354151] bg-background px-10 py-2.5 text-sm" required type="url" placeholder="https://cdn.example.com/video.mp4" value={mediaUrl} onChange={event=>setMediaUrl(event.target.value)}/></div><span className="mt-1.5 block text-xs text-neutral">R2 업로드 대신 외부 HTTPS 영상 주소를 직접 입력할 수도 있습니다.</span></label>
      <label className="block"><span className="mb-2 block text-sm font-medium">제목</span><input className="focus-ring w-full rounded-lg border border-[#354151] bg-background px-3 py-2.5 text-sm" required maxLength={100} placeholder="게시물 제목" value={title} onChange={event=>setTitle(event.target.value)}/></label>
      <label className="block"><span className="mb-2 block text-sm font-medium">본문</span><textarea className="focus-ring min-h-32 w-full resize-y rounded-lg border border-[#354151] bg-background px-3 py-2.5 text-sm" required maxLength={2200} placeholder="게시 문구와 해시태그를 입력하세요." value={caption} onChange={event=>setCaption(event.target.value)}/></label>
      {error&&<div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}
      {result&&<div role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">{result.message} 작업 ID: {result.jobId}</div>}
      <button className="focus-ring flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={submitting||uploading} type="submit">{submitting?<Loader2 className="animate-spin" size={17}/>:<Send size={17}/>} {submitting?'게시 요청 중…':`${selected.length}개 채널에 게시 요청`}</button>
    </form>
  </div>;
}

function NewsControl(){const[running,setRunning]=useState(false);const[message,setMessage]=useState('');const collect=async()=>{setRunning(true);const response=await fetch('/api/admin/news/collect',{method:'POST'});const body=await response.json().catch(()=>({})) as {inserted?:number;duplicates?:number;error?:string};setMessage(response.ok?`신규 ${body.inserted}건 저장, 중복 ${body.duplicates}건 제외`:body.error||'수집 실패');setRunning(false)};return <div className="card p-6"><h2 className="font-semibold">금융 뉴스 관리</h2><p className="mt-3 text-sm leading-6 text-neutral">GDELT가 연결한 원문 제목·출처·링크를 수집합니다. 기사 전문은 저장하지 않으며, API 장애 시 가짜 데이터를 만들지 않습니다.</p><button className="mt-5 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={running} onClick={collect}>{running&&<Loader2 className="animate-spin" size={16}/>}지금 수집</button>{message&&<div className="mt-3 text-sm text-neutral">{message}</div>}</div>}

function AutomationSettings(){const[interval,setInterval]=useState(15);const[importance,setImportance]=useState(3);const[limit,setLimit]=useState(3);const[cost,setCost]=useState(10);const[message,setMessage]=useState('');const save=async(event:FormEvent)=>{event.preventDefault();const response=await fetch('/api/admin/automation/settings',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({newsIntervalMinutes:interval,minimumImportance:importance,dailyVideoLimit:limit,dailyCostLimitUsd:cost,markets:['us','kr','crypto','macro'],socialPlatforms:[],autoVideoEnabled:false})});setMessage(response.ok?'저장했습니다. 관리자 승인은 항상 필수입니다.':'설정 저장에 실패했습니다.')};return <form className="card grid gap-4 p-6 sm:grid-cols-2" onSubmit={save}><div className="sm:col-span-2"><h2 className="font-semibold">자동화 설정</h2><p className="mt-2 text-sm text-neutral">초기 운영 안전 정책에 따라 자동 영상 제작과 SNS 자동 발행은 비활성화되고 관리자 승인은 강제로 유지됩니다.</p></div><label className="text-sm">뉴스 수집 주기(분)<input className="mt-2 w-full rounded border border-[#354151] bg-background p-2" type="number" min="5" max="1440" value={interval} onChange={e=>setInterval(Number(e.target.value))}/></label><label className="text-sm">최소 중요도<input className="mt-2 w-full rounded border border-[#354151] bg-background p-2" type="number" min="1" max="5" value={importance} onChange={e=>setImportance(Number(e.target.value))}/></label><label className="text-sm">일일 영상 제한<input className="mt-2 w-full rounded border border-[#354151] bg-background p-2" type="number" min="0" max="100" value={limit} onChange={e=>setLimit(Number(e.target.value))}/></label><label className="text-sm">일일 비용 한도(USD)<input className="mt-2 w-full rounded border border-[#354151] bg-background p-2" type="number" min="0" step="0.01" value={cost} onChange={e=>setCost(Number(e.target.value))}/></label><button className="w-fit rounded bg-primary px-4 py-2 text-sm text-white">설정 저장</button>{message&&<span className="text-sm text-neutral">{message}</span>}</form>}

export default function Admin(){const path=useLocation().pathname;const page=path.split('/').at(-1)||'admin';const items=[['/admin/news','금융 뉴스 관리',RadioTower],['/admin/news-analysis','AI 뉴스 분석',Activity],['/admin/video-studio','AI 영상 제작',Film],['/admin/media','영상 라이브러리',Database],['/admin/publish','SNS 통합 게시',Share2],['/admin/history','게시 기록',RadioTower],['/admin/performance','콘텐츠 성과 분석',Activity],['/admin/settings','자동화 설정',Settings2]];return <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-8"><div className="mb-7 flex items-center gap-3"><div className="rounded-lg bg-primary/10 p-2 text-primary"><LockKeyhole/></div><div><div className="label">SECURE OPERATIONS</div><h1 className="text-2xl font-semibold">관리자 콘솔</h1></div></div><div className="grid gap-5 lg:grid-cols-[220px_1fr]"><nav className="card h-fit p-2">{items.map(([to,label,Icon])=><Link key={to as string} to={to as string} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${path===to?'bg-primary/10 text-primary':'text-neutral'}`}><Icon size={17}/>{label as string}</Link>)}</nav><section className="space-y-5"><div className="rounded-xl border border-[#f5b942]/30 bg-[#f5b942]/5 p-4 text-sm text-[#e9bd58]">자동 SNS 발행은 기본 비활성화 상태입니다. 분석·대본 사실 확인과 관리자 승인 후에만 렌더링 및 게시를 진행하세요.</div>{page==='admin'&&<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['뉴스 수집','GDELT 연결'],['분석 엔진','AI 설정 필요'],['영상 렌더러','Queue 연결 필요'],['SNS 연결','Make/OAuth 확인 필요']].map(([a,b])=><div className="card p-5" key={a}><div className="text-sm text-neutral">{a}</div><div className="mt-3 font-semibold">{b}</div></div>)}</div>}{page==='publish'?<PublishPanel/>:page==='video-studio'?<VideoStudio/>:page==='news'?<NewsControl/>:page==='news-analysis'?<News adminControls/>:page==='settings'?<AutomationSettings/>:<div className="card p-6"><div className="flex items-center gap-2"><Database size={18} className="text-primary"/><h2 className="font-semibold">{String(items.find(item=>String(item[0]).endsWith(page))?.[1]||'운영 상태')}</h2></div><p className="mt-3 text-sm leading-6 text-neutral">데이터 계약과 상태 저장 구조가 준비됐습니다. 외부 공급자 연결 상태에 따라 실제 데이터만 표시합니다.</p></div>}</section></div></main>}
