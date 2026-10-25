# News, AI, video and SNS automation

## Implemented in the Pages application

- `GET /api/news`: stored source metadata and completed analysis summaries
- `POST /api/admin/news/collect`: authenticated collection from the real GDELT document API
- `POST /api/admin/news/analyze`: authenticated, schema-validated AI analysis with four-timeframe technical snapshots when a supported symbol can be mapped
- `POST /api/admin/video-projects`: creates a fact-check-required 9:16 project draft
- `POST /api/admin/video-projects/approve`: requires explicit approval and enqueues one idempotent render job
- `POST /api/video/webhook`: authenticated renderer status callback; completion is accepted only when the reported R2 object exists
- Existing private R2 upload, signed media delivery, Make publishing and per-platform callbacks are reused.

News stores title, source, canonical source URL and timestamps, but not unauthorized article bodies. URL hashes prevent duplicate articles and normalized headline fingerprints group related coverage. GDELT needs no API key; it indexes links to original publishers and is not a license to republish their full text.

## Manual infrastructure

Apply `migrations/0004_news_video_automation.sql` to the existing D1 database. Configure an AI endpoint only after choosing its data retention and commercial terms. Bind a Cloudflare Queue producer as `VIDEO_RENDER_QUEUE`; its consumer must run in a separately approved Node environment with Remotion, Chromium and FFmpeg. Pages Functions cannot perform the render reliably. The renderer needs restricted R2 write credentials and calls `/api/video/webhook` with `VIDEO_RENDER_WEBHOOK_TOKEN`.

Schedule `POST /api/admin/news/collect` every 15 minutes from an authenticated Make schedule or another approved scheduler. Cloudflare Access service-token headers are required. Do not expose the collection endpoint publicly.

TTS is not selected or enabled. Before implementation, choose a provider with Korean commercial usage rights and store credentials only in the renderer. Music, sound effects and stock media require documented commercial licenses.

## Prediction integrity

`prediction_evaluations.record_kind` separates live news, live technical, news backtest and technical backtest records. No probabilities are written unless a separately validated model supplies them. A future backtest runner must enforce `news.published_at <= analyzed_at` and candle close times at or before the simulated analysis time. No such runner is enabled yet.

## Approximate operating cost

GDELT collection itself is free, subject to fair-use availability. Cloudflare Pages, D1, R2 and Queues often begin within free allowances; storage, operations and egress depend on account plan and usage. AI analysis, Korean TTS, rendering compute, Make operations and SNS API tiers are provider-dependent. Set `automation_settings.daily_cost_limit_usd`; the current foundation records usage but does not yet stop third-party billing automatically. Start with manual collection/analysis, one approved render at a time and SNS auto-publish disabled.

## External approvals still required

- AI model provider key and approved model
- Korean TTS provider and commercial voice rights
- Queue consumer/render host with Remotion + FFmpeg
- YouTube, Instagram, TikTok, Threads and X application review/OAuth scopes
- Licensed music, effects and supporting media
- Publisher/API terms review for any source added beyond GDELT
