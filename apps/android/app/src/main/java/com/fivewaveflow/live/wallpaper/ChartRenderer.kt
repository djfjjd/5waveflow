package com.fivewaveflow.live.wallpaper

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import androidx.core.graphics.withSave
import com.fivewaveflow.live.data.MarketSnapshot
import com.fivewaveflow.live.data.WallpaperConfig
import kotlin.math.max
import kotlin.math.min

class ChartRenderer {
    private val paint=Paint(Paint.ANTI_ALIAS_FLAG)
    fun draw(canvas:Canvas,bounds:Rect,snapshot:MarketSnapshot?,config:WallpaperConfig,error:Boolean=false){
        val dark=config.theme=="dark";canvas.drawColor(Color.parseColor(if(dark)"#0B1017" else "#F4F7FB"));canvas.withSave{clipRect(bounds);translate(bounds.left.toFloat(),bounds.top.toFloat());drawContent(this,Rect(0,0,bounds.width(),bounds.height()),snapshot,config,error)}
    }
    private fun drawContent(canvas:Canvas,bounds:Rect,snapshot:MarketSnapshot?,config:WallpaperConfig,error:Boolean){
        val dark=config.theme=="dark";paint.color=Color.parseColor(if(dark)"#FFFFFF" else "#111827");paint.textSize=bounds.width()*.045f;paint.isFakeBoldText=true;canvas.drawText("5WaveFlow Live",bounds.width()*.06f,bounds.height()*.1f,paint)
        if(snapshot==null){paint.textSize=bounds.width()*.032f;paint.isFakeBoldText=false;paint.color=Color.parseColor(if(error)"#FF5C70" else "#8B95A5");canvas.drawText(if(error)"Market data unavailable" else "Connecting…",bounds.width()*.06f,bounds.height()*.16f,paint);return}
        paint.textSize=bounds.width()*.07f;paint.color=Color.parseColor(if(dark)"#FFFFFF" else "#111827");canvas.drawText(String.format("%,.2f",snapshot.price),bounds.width()*.06f,bounds.height()*.18f,paint);paint.textSize=bounds.width()*.032f;paint.color=Color.parseColor(if(snapshot.changePercent>=0)"#00C896" else "#FF5C70");canvas.drawText(String.format("%+.2f%% · %s",snapshot.changePercent,snapshot.provider),bounds.width()*.06f,bounds.height()*.225f,paint)
        paint.textSize=bounds.width()*.029f;paint.isFakeBoldText=true;paint.color=Color.parseColor("#00C896");canvas.drawText("UP ${snapshot.scores.bullish}%",bounds.width()*.06f,bounds.height()*.265f,paint);paint.color=Color.parseColor("#8B95A5");canvas.drawText("FLAT ${snapshot.scores.sideways}%",bounds.width()*.35f,bounds.height()*.265f,paint);paint.color=Color.parseColor("#FF5C70");canvas.drawText("DOWN ${snapshot.scores.bearish}%",bounds.width()*.68f,bounds.height()*.265f,paint);paint.isFakeBoldText=false
        val candles=snapshot.candles.takeLast(90);if(candles.isEmpty())return;val left=bounds.width()*.06f;val right=bounds.width()*.94f;val top=bounds.height()*.28f;val bottom=bounds.height()*.82f;val high=candles.maxOf{it.high};val low=candles.minOf{it.low};val range=max(high-low,.0001f);val step=(right-left)/candles.size;val body=max(2f,step*.62f)
        candles.forEachIndexed{index,candle->val x=left+step*(index+.5f);val yHigh=top+(high-candle.high)/range*(bottom-top);val yLow=top+(high-candle.low)/range*(bottom-top);val yOpen=top+(high-candle.open)/range*(bottom-top);val yClose=top+(high-candle.close)/range*(bottom-top);paint.color=Color.parseColor(if(candle.close>=candle.open)"#00C896" else "#FF5C70");paint.strokeWidth=max(1f,step*.12f);canvas.drawLine(x,yHigh,x,yLow,paint);canvas.drawRect(x-body/2,min(yOpen,yClose),x+body/2,max(yOpen,yClose)+1f,paint)}
        paint.textSize=bounds.width()*.026f;paint.color=Color.parseColor("#8B95A5");canvas.drawText("${snapshot.symbol} · ${snapshot.interval} · ${snapshot.updatedAt}",left,bounds.height()*.9f,paint)
    }
}
