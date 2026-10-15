package com.fivewaveflow.live.data

import com.fivewaveflow.live.BuildConfig
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

data class Candle(val time:Long,val open:Float,val high:Float,val low:Float,val close:Float,val volume:Float)
data class MarketSnapshot(val symbol:String,val interval:String,val price:Double,val changePercent:Double,val updatedAt:String,val candles:List<Candle>,val provider:String,val stale:Boolean)

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
            MarketSnapshot(symbol,interval,ticker.getDouble("price"),ticker.getDouble("changePercent"),root.getString("updatedAt"),candles,root.getString("provider"),root.getString("dataStatus")!="fresh")
        } finally { connection.disconnect() }
    }
}
