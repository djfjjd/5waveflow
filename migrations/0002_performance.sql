CREATE TABLE performance_predictions (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  exchange TEXT NOT NULL,
  timeframe TEXT NOT NULL CHECK(timeframe IN ('15m','1h','4h','1d')),
  record_kind TEXT NOT NULL CHECK(record_kind IN ('backtest','live')),
  prediction_time TEXT NOT NULL,
  target_time TEXT NOT NULL,
  prediction_price REAL NOT NULL,
  bullish_probability REAL NOT NULL,
  sideways_probability REAL NOT NULL,
  bearish_probability REAL NOT NULL,
  predicted_direction TEXT NOT NULL CHECK(predicted_direction IN ('bullish','sideways','bearish')),
  actual_direction TEXT CHECK(actual_direction IN ('bullish','sideways','bearish')),
  observed_price REAL,
  return_percent REAL,
  sideways_threshold_percent REAL NOT NULL,
  hit INTEGER CHECK(hit IN (0,1)),
  model_version TEXT NOT NULL,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(abs(bullish_probability+sideways_probability+bearish_probability-1.0)<0.0001)
);
CREATE INDEX idx_performance_recent ON performance_predictions(symbol,timeframe,record_kind,target_time DESC);
