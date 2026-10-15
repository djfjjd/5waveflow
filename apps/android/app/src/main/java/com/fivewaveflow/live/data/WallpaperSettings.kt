package com.fivewaveflow.live.data

import android.content.Context

data class WallpaperConfig(val symbol:String="BTCUSDT",val interval:String="15m",val theme:String="dark")
class WallpaperSettings(context:Context){
    private val prefs=context.getSharedPreferences("wallpaper",Context.MODE_PRIVATE)
    fun read()=WallpaperConfig(prefs.getString("symbol","BTCUSDT")!!,prefs.getString("interval","15m")!!,prefs.getString("theme","dark")!!)
    fun write(config:WallpaperConfig)=prefs.edit().putString("symbol",config.symbol).putString("interval",config.interval).putString("theme",config.theme).apply()
}
