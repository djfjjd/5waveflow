export type RenderStatus='generating_script'|'generating_audio'|'rendering'|'completed'|'failed';

export interface NewsSection {
  type?:string;
  index?:number;
  title?:string;
  text?:string;
  source?:string;
  sentiment?:string;
}

export interface RenderRequest {
  version:number;
  jobId:string;
  projectId:string;
  composition:'NewsShort';
  width:number;
  height:number;
  fps:number;
  durationSeconds:number;
  voice:'none'|'male'|'female';
  voiceSpeed:number;
  script:{hook?:string;sections?:NewsSection[];branding?:string;disclaimer?:string};
  output:{format:'mp4';r2Binding?:string};
  callbackUrl:string;
}

export interface TimedSection extends NewsSection {startMs:number;endMs:number}
export interface Caption {text:string;startMs:number;endMs:number;timestampMs:number|null;confidence:number|null}
export interface NewsShortProps extends Record<string,unknown> {
  hook:string;
  sections:TimedSection[];
  branding:string;
  disclaimer:string;
  captions:Caption[];
}
