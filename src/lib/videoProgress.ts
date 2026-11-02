const progressByStatus:Record<string,number>={draft:0,queued:10,generating_script:35,generating_audio:55,rendering:80,completed:100,failed:0};

export function videoProgress(status:string){return progressByStatus[status]??0}
export function estimatedVideoProgress(status:string,updatedAt?:string,now=Date.now()){const base=videoProgress(status);if(['draft','completed','failed'].includes(status)||!updatedAt)return base;const timestamp=Date.parse(updatedAt.includes('T')?updatedAt:`${updatedAt.replace(' ','T')}Z`);if(!Number.isFinite(timestamp))return base;const elapsed=Math.max(0,Math.floor((now-timestamp)/1000));return Math.min(90,base+Math.floor(elapsed/10)*5)}
export function isRenderCallbackDelayed(status:string,updatedAt?:string,now=Date.now()){if(!updatedAt||['draft','completed','failed'].includes(status))return false;const timestamp=Date.parse(updatedAt.includes('T')?updatedAt:`${updatedAt.replace(' ','T')}Z`);return Number.isFinite(timestamp)&&now-timestamp>=300_000}
