ALTER TABLE news_articles ADD COLUMN provider_key TEXT NOT NULL DEFAULT 'gdelt';
ALTER TABLE news_articles ADD COLUMN ingestion_method TEXT NOT NULL DEFAULT 'api';

CREATE TABLE news_source_settings (
  provider_key TEXT PRIMARY KEY CHECK(provider_key IN ('gdelt','naver','coinness','xangle')),
  display_name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
  interval_minutes INTEGER NOT NULL DEFAULT 15 CHECK(interval_minutes BETWEEN 5 AND 1440),
  connection_status TEXT NOT NULL CHECK(connection_status IN ('connected','credentials_required','partnership_required','manual_only','disabled','error')),
  search_terms_json TEXT NOT NULL DEFAULT '[]',
  last_attempt_at TEXT,
  last_success_at TEXT,
  last_error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO news_source_settings(provider_key,display_name,enabled,connection_status,search_terms_json) VALUES
  ('gdelt','GDELT',1,'connected','[]'),
  ('naver','네이버 뉴스',0,'credentials_required','["주식","금융","환율","금리","기업 실적","경제정책"]'),
  ('coinness','코인니스',0,'partnership_required','[]'),
  ('xangle','쟁글',0,'partnership_required','[]');

CREATE TABLE news_collection_runs (
  id TEXT PRIMARY KEY,
  provider_key TEXT NOT NULL REFERENCES news_source_settings(provider_key),
  status TEXT NOT NULL CHECK(status IN ('running','succeeded','failed','skipped')),
  fetched_count INTEGER NOT NULL DEFAULT 0,
  inserted_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  estimated_cost_usd REAL NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);
CREATE INDEX idx_news_runs_provider_time ON news_collection_runs(provider_key,started_at DESC);
