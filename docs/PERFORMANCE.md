# Performance backtest and live validation

`/performance` displays reproducible `quant-direction-v1` backtests for BTCUSDT on 15m, 1h, 4h, and 1d closed candles. Backtest rows are stored as `record_kind=backtest`; predictions created by the scheduled workflow are stored separately as `record_kind=live`.

## D1

Apply `migrations/0001_initial.sql` and `migrations/0002_performance.sql`, then bind the database to the Pages project as `DB`. Do not add a production database ID to the repository.

## Scheduled validation

Copy `wrangler.performance.example.jsonc` to a deployment-only configuration, set `SITE_ORIGIN`, store the same `CRON_SECRET` in the Worker and Pages environments, and deploy only after approval. The Worker calls the protected performance endpoint every 15 minutes. Each call:

1. persists immutable backtest results with `INSERT OR IGNORE`;
2. resolves pending live predictions when their target candle has closed;
3. creates one prediction for the next candle if it does not already exist.

No history is deleted. The UI requests only the latest 30 reproducible backtest observations, while D1 retains the original records.
