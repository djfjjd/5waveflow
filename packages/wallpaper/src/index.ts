export type WallpaperPresetId='minimal'|'professional'|'ai';
export type WallpaperTheme='dark'|'light';
export type WallpaperPreset={id:WallpaperPresetId;name:string;showPriceScale:boolean;showVolume:boolean;showLogo:boolean;showAnalysis:boolean};

export const WALLPAPER_PRESETS:WallpaperPreset[]=[
  {id:'minimal',name:'Minimal',showPriceScale:false,showVolume:false,showLogo:true,showAnalysis:false},
  {id:'professional',name:'Professional',showPriceScale:true,showVolume:true,showLogo:true,showAnalysis:false},
  {id:'ai',name:'AI Analysis',showPriceScale:true,showVolume:true,showLogo:true,showAnalysis:true},
];
