import {FormEvent,useState} from 'react';
import {Activity,CheckCircle2,Database,Film,Link2,Loader2,LockKeyhole,RadioTower,Send,Settings2,Share2} from 'lucide-react';
import {Link,useLocation} from 'react-router-dom';

const platforms=['instagram','youtube','tiktok','x','threads'] as const;
type Platform=typeof platforms[number];
type PublishResult={ok:boolean;jobId:string;message:string;platforms:Platform[]};
const platformLabels:Record<Platform,string>={instagram:'Instagram',youtube:'YouTube',tiktok:'TikTok',x:'X',threads:'Threads'};

function PublishPanel(){
  const [selected,setSelected]=useState<Platform[]>(['instagram','youtube','tiktok','x','threads']);
  const [mediaUrl,setMediaUrl]=useState('');
  const [title,setTitle]=useState('');
  const [caption,setCaption]=useState('');
  const [submitting,setSubmitting]=useState(false);
  const [result,setResult]=useState<PublishResult|null>(null);
  const [error,setError]=useState('');
  const toggle=(platform:Platform)=>setSelected(current=>current.includes(platform)?current.filter(item=>item!==platform):[...current,platform]);
  const submit=async(event:FormEvent)=>{
    event.preventDefault();setError('');setResult(null);
    if(!selected.length){setError('게시할 플랫폼을 하나 이상 선택해 주세요.');return}
    setSubmitting(true);
    try{
      const response=await fetch('/api/admin/publish',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({platforms:selected,mediaUrl,title,caption})});
      const body=await response.json().catch(()=>({})) as Partial<PublishResult>&{error?:string};
      if(!response.ok)throw new Error(body.error||'게시 요청에 실패했습니다.');
      setResult(body as PublishResult);
    }catch(reason){setError(reason instanceof Error?reason.message:'게시 요청에 실패했습니다.')}finally{setSubmitting(false)}
  };
  return <div className="card p-6">
    <div className="flex items-center gap-2"><Share2 size={18} className="text-primary"/><h2 className="font-semibold">SNS 원클릭 업로드</h2></div>
    <p className="mt-3 text-sm leading-6 text-neutral">공개 미디어 URL과 문구를 입력하면 선택한 채널로 한 번에 발행 요청을 보냅니다.</p>
    <form className="mt-6 space-y-5" onSubmit={submit}>
      <fieldset><legend className="mb-2 text-sm font-medium">게시 채널</legend><div className="flex flex-wrap gap-2">{platforms.map(platform=><button className={`focus-ring rounded-full border px-3 py-2 text-sm transition ${selected.includes(platform)?'border-primary bg-primary/10 text-primary':'border-[#354151] text-neutral'}`} type="button" aria-pressed={selected.includes(platform)} onClick={()=>toggle(platform)} key={platform}>{selected.includes(platform)&&<CheckCircle2 className="mr-1.5 inline" size={15}/>} {platformLabels[platform]}</button>)}</div></fieldset>
      <label className="block"><span className="mb-2 block text-sm font-medium">미디어 URL</span><div className="relative"><Link2 className="absolute left-3 top-3 text-neutral" size={17}/><input className="focus-ring w-full rounded-lg border border-[#354151] bg-background px-10 py-2.5 text-sm" required type="url" placeholder="https://cdn.example.com/video.mp4" value={mediaUrl} onChange={event=>setMediaUrl(event.target.value)}/></div><span className="mt-1.5 block text-xs text-neutral">각 SNS 서버가 접근할 수 있는 HTTPS 이미지 또는 영상 주소가 필요합니다.</span></label>
      <label className="block"><span className="mb-2 block text-sm font-medium">제목</span><input className="focus-ring w-full rounded-lg border border-[#354151] bg-background px-3 py-2.5 text-sm" required maxLength={100} placeholder="게시물 제목" value={title} onChange={event=>setTitle(event.target.value)}/></label>
      <label className="block"><span className="mb-2 block text-sm font-medium">본문</span><textarea className="focus-ring min-h-32 w-full resize-y rounded-lg border border-[#354151] bg-background px-3 py-2.5 text-sm" required maxLength={2200} placeholder="게시 문구와 해시태그를 입력하세요." value={caption} onChange={event=>setCaption(event.target.value)}/></label>
      {error&&<div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}
      {result&&<div role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">{result.message} 작업 ID: {result.jobId}</div>}
      <button className="focus-ring flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={submitting} type="submit">{submitting?<Loader2 className="animate-spin" size={17}/>:<Send size={17}/>} {submitting?'업로드 요청 중…':`${selected.length}개 채널에 업로드`}</button>
    </form>
  </div>;
}

export default function Admin(){const path=useLocation().pathname;const page=path.split('/').at(-1)||'admin';const items=[['/admin/analytics','분석 관리',Activity],['/admin/studio','콘텐츠 스튜디오',Film],['/admin/publish','SNS 원클릭 업로드',Share2],['/admin/history','제작 이력',RadioTower],['/admin/settings','설정',Settings2]];return <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-8"><div className="mb-7 flex items-center gap-3"><div className="rounded-lg bg-primary/10 p-2 text-primary"><LockKeyhole/></div><div><div className="label">SECURE OPERATIONS</div><h1 className="text-2xl font-semibold">관리자 콘솔</h1></div></div><div className="grid gap-5 lg:grid-cols-[220px_1fr]"><nav className="card h-fit p-2">{items.map(([to,label,Icon])=><Link key={to as string} to={to as string} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${path===to?'bg-primary/10 text-primary':'text-neutral'}`}><Icon size={17}/>{label as string}</Link>)}</nav><section className="space-y-5"><div className="rounded-xl border border-[#f5b942]/30 bg-[#f5b942]/5 p-4 text-sm text-[#e9bd58]">Cloudflare Access가 설정된 배포 환경에서만 관리자 API가 열립니다. 로컬 UI는 구조 확인용입니다.</div>{page==='admin'&&<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['데이터 수집','Binance 연결 상태'],['분석 엔진','지표 계산 가능'],['확률 모델','검증 전'],['SNS 연결','Webhook 설정 필요']].map(([a,b])=><div className="card p-5" key={a}><div className="text-sm text-neutral">{a}</div><div className="mt-3 font-semibold">{b}</div></div>)}</div>}{page==='publish'?<PublishPanel/>:<div className="card p-6"><div className="flex items-center gap-2"><Database size={18} className="text-primary"/><h2 className="font-semibold">{page==='studio'?'콘텐츠 제작':page==='analytics'?'시장 분석 실행':page==='settings'?'관리자 설정':'운영 상태'}</h2></div><p className="mt-3 text-sm leading-6 text-neutral">{page==='studio'?'9:16 영상 프로젝트 UI와 데이터 계약을 준비했습니다. 실제 Remotion 렌더링은 PHASE 2입니다.':'서버 인증 및 D1 연결 후 운영 데이터가 표시됩니다.'}</p><button disabled className="mt-6 rounded-lg bg-[#26303d] px-4 py-2 text-sm text-neutral/50">준비 중</button></div>}</section></div></main>}
