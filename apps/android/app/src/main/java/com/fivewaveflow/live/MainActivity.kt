package com.fivewaveflow.live

import android.app.WallpaperManager
import android.content.ComponentName
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import com.fivewaveflow.live.data.MarketRepository
import com.fivewaveflow.live.data.MarketSnapshot
import com.fivewaveflow.live.data.WallpaperConfig
import com.fivewaveflow.live.data.WallpaperSettings
import com.fivewaveflow.live.wallpaper.FiveWaveWallpaperService
import kotlin.math.max
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MainActivity:ComponentActivity(){
    override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);setContent{MaterialTheme(colorScheme=darkColorScheme(primary=Color(0xFF4F8CFF),background=Color(0xFF0B1017),surface=Color(0xFF151B23))){App{config->WallpaperSettings(this).write(config);startActivity(Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER).putExtra(WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT,ComponentName(this,FiveWaveWallpaperService::class.java)))}}}}
}

@Composable private fun App(apply:(WallpaperConfig)->Unit){
    var config by remember{mutableStateOf(WallpaperConfig())};var snapshot by remember{mutableStateOf<MarketSnapshot?>(null)};var error by remember{mutableStateOf(false)}
    LaunchedEffect(config.symbol,config.interval){snapshot=null;error=false;val result=withContext(Dispatchers.IO){MarketRepository().load(config.symbol,config.interval)};result.onSuccess{snapshot=it}.onFailure{error=true}}
    Scaffold{padding->Column(Modifier.padding(padding).padding(16.dp).fillMaxSize(),verticalArrangement=Arrangement.spacedBy(14.dp)){Text("5WaveFlow Live",style=MaterialTheme.typography.headlineMedium);Text("실시간 금융 차트 라이브 월페이퍼",color=Color(0xFF8B95A5));Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){Choice("BTC/USDT",config.symbol=="BTCUSDT"){config=config.copy(symbol="BTCUSDT")};Choice("BTC/KRW",config.symbol=="BTCKRW"){config=config.copy(symbol="BTCKRW")};Choice("ETH/USDT",config.symbol=="ETHUSDT"){config=config.copy(symbol="ETHUSDT")}};if(config.symbol=="BTCKRW")Text("개발 미리보기 · 스토어 출시 전 Upbit 데이터 사용 승인 필요",style=MaterialTheme.typography.labelSmall,color=Color(0xFFFFB020));Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){listOf("1m","5m","15m","1h","4h","1d").forEach{Choice(it,config.interval==it){config=config.copy(interval=it)}}};Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){Choice("Dark",config.theme=="dark"){config=config.copy(theme="dark")};Choice("Light",config.theme=="light"){config=config.copy(theme="light")}};Box(Modifier.weight(1f).fillMaxWidth().background(if(config.theme=="dark")Color(0xFF0B1017) else Color(0xFFF4F7FB))){Preview(snapshot,error)};Button(onClick={apply(config)},modifier=Modifier.fillMaxWidth()){Text("홈 화면 배경화면으로 설정")}}}
}

@Composable private fun Choice(text:String,selected:Boolean,onClick:()->Unit){FilterChip(selected=selected,onClick=onClick,label={Text(text)})}
@Composable private fun Preview(snapshot:MarketSnapshot?,error:Boolean){if(snapshot==null){Box(Modifier.fillMaxSize(),contentAlignment=androidx.compose.ui.Alignment.Center){Text(if(error)"시장 데이터 연결 오류" else "실제 데이터 연결 중…",color=if(error)Color(0xFFFF5C70) else Color(0xFF8B95A5))};return};val candles=snapshot.candles.takeLast(70);Column(Modifier.padding(18.dp)){Text("${snapshot.symbol} · ${snapshot.interval}",color=Color(0xFF8B95A5));Text(String.format("%,.2f",snapshot.price),style=MaterialTheme.typography.headlineLarge);Text(String.format("%+.2f%% · %s",snapshot.changePercent,snapshot.provider),color=if(snapshot.changePercent>=0)Color(0xFF00C896) else Color(0xFFFF5C70));Canvas(Modifier.fillMaxWidth().weight(1f)){if(candles.isEmpty())return@Canvas;val high=candles.maxOf{it.high};val low=candles.minOf{it.low};val range=max(high-low,.0001f);val step=size.width/candles.size;candles.forEachIndexed{index,c->val x=step*(index+.5f);fun y(value:Float)=((high-value)/range)*size.height;val color=if(c.close>=c.open)Color(0xFF00C896) else Color(0xFFFF5C70);drawLine(color,Offset(x,y(c.high)),Offset(x,y(c.low)),strokeWidth=max(1f,step*.12f));drawRect(color,Offset(x-step*.3f,minOf(y(c.open),y(c.close))),Size(step*.6f,max(1f,kotlin.math.abs(y(c.open)-y(c.close)))),style=Stroke(width=max(1f,step*.16f)))}}}}
