ALTER TABLE video_render_jobs ADD COLUMN progress_percent INTEGER NOT NULL DEFAULT 10 CHECK(progress_percent BETWEEN 0 AND 100);
