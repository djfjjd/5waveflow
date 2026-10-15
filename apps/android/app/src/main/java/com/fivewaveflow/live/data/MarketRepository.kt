package com.fivewaveflow.live.data

import com.fivewaveflow.live.BuildConfig
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

data class Candle(val time:Long,val open:Float,val high:Float,val low:Float,val close:Float,val volume:Float)
data class SignalScores(val bullish:Int,val sideways:Int,val bearish:Int)
data class MarketSnapshot(val symbol:String,val interval:String,val price:Double,val changePercent:Double,val updatedAt:String,val candles:List<Candle>,val provider:String,val stale:Boolean,val scores:SignalScores)

private fun JSONObject.numberOrNull(name:String)=if(isNull(name)||!has(name))null else getDouble(name)
private fun scores(indicators:JSONObject):SignalScores { var bullish=20;var sideways=20;var bearish=20;indicators.numberOrNull("rsi")?.let{if(it>55)bullish+=20 else if(it<45)bearish+=20 else sideways+=20};val macd=indicators.numberOrNull("macd");val signal=indicators.numberOrNull("signal");if(macd!=null&&signal!=null){if(macd>signal)bullish+=20 else bearish+=20};val e20=indicators.numberOrNull("ema20");val e50=indicators.numberOrNull("ema50");val e200=indicators.numberOrNull("ema200");if(e20!=null&&e50!=null&&e200!=null){if(e20>e50&&e50>e200)bullish+=25 else if(e20<e50&&e50<e200)bearish+=25 else sideways+=25};if(kotlin.math.abs(indicators.numberOrNull("volumeChangePercent")?:0.0)<10)sideways+=15;val total=bullish+sideways+bearish;val up=(bullish*100.0/total).toInt();val flat=(sideways*100.0/total).toInt();return SignalScores(up,flat,100-up-flat) }

class MarketRepository {
    fun load(symbol:String,interval:String):Result<MarketSnapshot> = runCatching {
        val market=if(symbol.endsWith("KRW"))"upbit" else "usdt"
        val apiSymbol=if(symbol=="BTCKRW")"BTCUSDT" else symbol
        val url=URL("${BuildConfig.API_BASE_URL}/api/market?symbol=$apiSymbol&interval=$interval&market=$market")
        val connection=(url.openConnection() as HttpURLConnection).apply { connectTimeout=8_000;readTimeout=8_000;requestMethod="GET";setRequestProperty("Accept","application/json") }
        try {
            if(connection.responseCode !in 200..299)error("Market API ${connection.responseCode}")
            val root=JSONObject(connection.inputStream.bufferedReader().use { it.readText() })
            val rows=root.getJSONArray("candles"),candles=buildList { for(index in 0 until rows.length()){val row=rows.getJSONObject(index);add(Candle(row.getLong("time"),row.getDouble("open").toFloat(),row.getDouble("high").toFloat(),row.getDouble("low").toFloat(),row.getDouble("close").toFloat(),row.getDouble("volume").toFloat()))} }
            val ticker=root.getJSONObject("ticker")
            MarketSnapshot(symbol,interval,ticker.getDouble("price"),ticker.getDouble("changePercent"),root.getString("updatedAt"),candles,root.getString("provider"),root.getString("dataStatus")!="fresh",scores(root.getJSONObject("indicators")))
        } finally { connection.disconnect() }
    }
}
