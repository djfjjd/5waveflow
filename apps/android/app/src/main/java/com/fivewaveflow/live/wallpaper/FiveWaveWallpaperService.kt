package com.fivewaveflow.live.wallpaper

import android.os.Handler
import android.os.Looper
import android.service.wallpaper.WallpaperService
import android.graphics.Rect
import android.view.SurfaceHolder
import com.fivewaveflow.live.data.MarketRepository
import com.fivewaveflow.live.data.MarketSnapshot
import com.fivewaveflow.live.data.WallpaperSettings
import java.util.concurrent.Executors

class FiveWaveWallpaperService:WallpaperService(){
    override fun onCreateEngine():Engine=ChartEngine()
    private inner class ChartEngine:Engine(){
        private val main=Handler(Looper.getMainLooper());private val executor=Executors.newSingleThreadExecutor();private val repository=MarketRepository();private val renderer=ChartRenderer();private var visible=false;private var snapshot:MarketSnapshot?=null;private var failed=false;private var horizontalOffset=.5f
        private val refresh=object:Runnable{override fun run(){if(!visible)return;val config=WallpaperSettings(this@FiveWaveWallpaperService).read();executor.execute{val result=repository.load(config.symbol,config.interval);snapshot=result.getOrNull();failed=result.isFailure;main.post{drawFrame();if(visible)main.postDelayed(this,60_000)}}}}
        override fun onVisibilityChanged(isVisible:Boolean){visible=isVisible;main.removeCallbacks(refresh);if(visible)main.post(refresh)}
        override fun onSurfaceChanged(holder:SurfaceHolder,format:Int,width:Int,height:Int){drawFrame()}
        override fun onOffsetsChanged(xOffset:Float,yOffset:Float,xOffsetStep:Float,yOffsetStep:Float,xPixelOffset:Int,yPixelOffset:Int){horizontalOffset=xOffset.coerceIn(0f,1f);drawFrame()}
        override fun onSurfaceDestroyed(holder:SurfaceHolder){visible=false;main.removeCallbacks(refresh);super.onSurfaceDestroyed(holder)}
        override fun onDestroy(){visible=false;main.removeCallbacksAndMessages(null);executor.shutdownNow();super.onDestroy()}
        private fun drawFrame(){val holder=surfaceHolder;var canvas:android.graphics.Canvas?=null;try{canvas=holder.lockCanvas();if(canvas!=null){val surface=holder.surfaceFrame,screenWidth=resources.displayMetrics.widthPixels.coerceAtMost(surface.width()),screenHeight=resources.displayMetrics.heightPixels.coerceAtMost(surface.height()),left=((surface.width()-screenWidth)*horizontalOffset).toInt();renderer.draw(canvas,Rect(left,0,left+screenWidth,screenHeight),snapshot,WallpaperSettings(this@FiveWaveWallpaperService).read(),failed)}}finally{if(canvas!=null)holder.unlockCanvasAndPost(canvas)}}
    }
}
