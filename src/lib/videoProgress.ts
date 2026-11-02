const progressByStatus:Record<string,number>={draft:0,queued:10,generating_script:35,generating_audio:55,rendering:80,completed:100,failed:0};

export function videoProgress(status:string){return progressByStatus[status]??0}
