PRAGMA foreign_keys = ON;

CREATE TABLE news_events (
  id TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL UNIQUE,
  headline TEXT NOT NULL,
  category TEXT NOT NULL,
  importance INTEGER NOT NULL DEFAULT 1 CHECK(importance BETWEEN 1 AND 5),
  first_published_at TEXT NOT NULL,
  latest_published_at TEXT NOT NULL,
  article_count INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE news_articles (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES news_events(id),
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  published_at TEXT NOT NULL,
  collected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  summary TEXT,
  countries_json TEXT NOT NULL DEFAULT '[]',
  assets_json TEXT NOT NULL DEFAULT '[]',
  category TEXT NOT NULL,
  importance INTEGER NOT NULL DEFAULT 1 CHECK(importance BETWEEN 1 AND 5),
  analysis_status TEXT NOT NULL DEFAULT 'pending' CHECK(analysis_status IN ('pending','processing','completed','failed')),
  video_status TEXT NOT NULL DEFAULT 'not_started' CHECK(video_status IN ('not_started','queued','processing','completed','failed')),
  content_hash TEXT NOT NULL UNIQUE
);
CREATE INDEX idx_news_articles_time ON news_articles(published_at DESC);
CREATE INDEX idx_news_articles_status ON news_articles(analysis_status,importance DESC);

CREATE TABLE news_analysis (
  id TEXT PRIMARY KEY,
  news_id TEXT NOT NULL REFERENCES news_articles(id),
  summary TEXT NOT NULL,
  importance_reason TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK(sentiment IN ('positive','negative','neutral','mixed')),
  direct_assets_json TEXT NOT NULL,
  indirect_assets_json TEXT NOT NULL,
  impact_path TEXT NOT NULL,
  short_term_scenario TEXT NOT NULL,
  medium_term_scenario TEXT NOT NULL,
  priced_in_assessment TEXT NOT NULL,
  counter_scenario TEXT NOT NULL,
  invalidation_conditions TEXT NOT NULL,
  technical_alignment_json TEXT NOT NULL,
  data_snapshot_json TEXT NOT NULL,
  model_version TEXT NOT NULL,
  generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(news_id,model_version)
);

CREATE TABLE news_asset_impacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  analysis_id TEXT NOT NULL REFERENCES news_analysis(id),
  asset_symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL CHECK(timeframe IN ('15m','1h','4h','1d')),
  direction TEXT NOT NULL CHECK(direction IN ('bullish','sideways','bearish','uncertain')),
  rationale TEXT NOT NULL,
  UNIQUE(analysis_id,asset_symbol,timeframe)
);

CREATE TABLE prediction_evaluations (
  id TEXT PRIMARY KEY,
  news_id TEXT REFERENCES news_articles(id),
  analysis_id TEXT REFERENCES news_analysis(id),
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL CHECK(timeframe IN ('15m','1h','4h','1d')),
  record_kind TEXT NOT NULL CHECK(record_kind IN ('news_live','technical_live','news_backtest','technical_backtest')),
  analyzed_at TEXT NOT NULL,
  price_at_analysis REAL NOT NULL,
  predicted_direction TEXT NOT NULL CHECK(predicted_direction IN ('bullish','sideways','bearish','uncertain')),
  predicted_probability REAL,
  target_at TEXT NOT NULL,
  actual_price REAL,
  actual_direction TEXT CHECK(actual_direction IN ('bullish','sideways','bearish')),
  hit INTEGER CHECK(hit IN (0,1)),
  model_version TEXT NOT NULL,
  resolved_at TEXT,
  CHECK(predicted_probability IS NULL OR predicted_probability BETWEEN 0 AND 1)
);
CREATE INDEX idx_prediction_eval_recent ON prediction_evaluations(record_kind,analyzed_at DESC);

ALTER TABLE content_projects ADD COLUMN news_analysis_id TEXT REFERENCES news_analysis(id);
ALTER TABLE content_projects ADD COLUMN title TEXT;
ALTER TABLE content_projects ADD COLUMN style TEXT;
ALTER TABLE content_projects ADD COLUMN voice TEXT;
ALTER TABLE content_projects ADD COLUMN voice_speed REAL;
ALTER TABLE content_projects ADD COLUMN script_json TEXT;
ALTER TABLE content_projects ADD COLUMN captions_json TEXT;
ALTER TABLE content_projects ADD COLUMN approved_at TEXT;
ALTER TABLE content_projects ADD COLUMN estimated_cost_usd REAL NOT NULL DEFAULT 0;

CREATE TABLE video_render_jobs (
  id TEXT PRIMARY KEY,
  content_project_id TEXT NOT NULL REFERENCES content_projects(id),
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK(status IN ('queued','generating_script','generating_audio','rendering','completed','failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  failure_reason TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE media_assets (
  id TEXT PRIMARY KEY,
  content_project_id TEXT REFERENCES content_projects(id),
  r2_key TEXT NOT NULL UNIQUE,
  media_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER,
  duration_seconds REAL,
  rights_source TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE automation_settings (
  id INTEGER PRIMARY KEY CHECK(id=1),
  news_interval_minutes INTEGER NOT NULL DEFAULT 15 CHECK(news_interval_minutes BETWEEN 5 AND 1440),
  markets_json TEXT NOT NULL DEFAULT '["us","kr","crypto","macro"]',
  minimum_importance INTEGER NOT NULL DEFAULT 3 CHECK(minimum_importance BETWEEN 1 AND 5),
  auto_video_enabled INTEGER NOT NULL DEFAULT 0 CHECK(auto_video_enabled IN (0,1)),
  daily_video_limit INTEGER NOT NULL DEFAULT 3 CHECK(daily_video_limit BETWEEN 0 AND 100),
  social_platforms_json TEXT NOT NULL DEFAULT '[]',
  approval_required INTEGER NOT NULL DEFAULT 1 CHECK(approval_required IN (0,1)),
  daily_cost_limit_usd REAL NOT NULL DEFAULT 10,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO automation_settings(id) VALUES(1);

CREATE TABLE api_usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  operation TEXT NOT NULL,
  units REAL NOT NULL DEFAULT 0,
  estimated_cost_usd REAL NOT NULL DEFAULT 0,
  related_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
