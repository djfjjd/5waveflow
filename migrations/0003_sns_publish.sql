CREATE TABLE sns_publish_jobs (
  job_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  media_url TEXT NOT NULL,
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','dispatched','partial','succeeded','failed')),
  failure_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sns_publish_platforms (
  job_id TEXT NOT NULL REFERENCES sns_publish_jobs(job_id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK(platform IN ('instagram','youtube','tiktok','x','threads')),
  status TEXT NOT NULL CHECK(status IN ('pending','processing','succeeded','failed')),
  remote_post_id TEXT,
  post_url TEXT,
  failure_reason TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(job_id,platform)
);

CREATE INDEX idx_sns_publish_jobs_created ON sns_publish_jobs(created_at DESC);
CREATE INDEX idx_sns_publish_platform_status ON sns_publish_platforms(status,updated_at DESC);
