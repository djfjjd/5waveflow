# 5WaveFlow video renderer

Long-running Node service for the video workflow. It accepts an authenticated render job, builds a timed Korean subtitle track, renders a silent `NewsShort` Remotion composition, uploads the MP4 to the private `5waveflow-media` R2 bucket, and reports real status events to Pages. The finished video is designed for the creator to record or add a voice-over later.

## Runtime flow

1. `POST /render` authenticates `Authorization: Bearer <VIDEO_RENDER_DISPATCH_TOKEN>` or `x-make-apikey`.
2. The service returns HTTP 202 immediately and processes the job in the background.
3. It reports `generating_script`, `generating_audio`, and `rendering` only when each corresponding stage starts. The legacy `generating_audio` status now means subtitle timing/composition; no external TTS request is made.
4. It uploads `renders/<projectId>/<jobId>.mp4` to R2.
5. It reports `completed` only after the R2 upload succeeds. Any error reports `failed` with a bounded message.

The callback host is pinned to `APP_ORIGIN`; an untrusted `callbackUrl` from an incoming payload is rejected.

## Required environment

Copy `.env.example` into the secret/environment configuration of the Node host. Do not commit values.

- `APP_ORIGIN=https://5waveflow.pages.dev`
- `VIDEO_RENDER_DISPATCH_TOKEN`: same secret used by Pages to authenticate this renderer directly
- `VIDEO_RENDER_WEBHOOK_TOKEN`: same callback secret configured in Cloudflare Pages Production
- `R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`: restricted R2 Object Read & Write credentials for only `5waveflow-media`
- `R2_BUCKET_NAME=5waveflow-media`
- `RENDER_CONCURRENCY=1` initially

## Pages dispatch

Pages uses the public `VIDEO_RENDER_SERVICE_URL` from `wrangler.jsonc` and the Production Secret `VIDEO_RENDER_DISPATCH_TOKEN` to call this renderer directly. The video workflow does not depend on a Make scenario. The renderer reports real progress and completion through the job-scoped signed `callbackUrl` supplied by Pages.

## Build and run

```bash
npm run build --workspace packages/video-renderer
npm run start --workspace packages/video-renderer
```

Health check: `GET /health` returns `{ "ok": true }`.

For a container host, build with `packages/video-renderer/Dockerfile` using the repository root as build context. The image includes Chromium and FFmpeg.

## Cloudflare Containers deployment

The production renderer is a separate Worker + Container application in the same Cloudflare account as 5WaveFlow. It is configured by `wrangler.renderer.jsonc` and uses `Dockerfile.video-renderer`.

Set these Worker secrets before the first deployment:

- `VIDEO_RENDER_DISPATCH_TOKEN`
- `VIDEO_RENDER_WEBHOOK_TOKEN`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

Then deploy from the repository root:

```bash
npx wrangler deploy --config wrangler.renderer.jsonc
```

The public Worker accepts only `/health` and `/render`. The Container remains awake for 30 minutes after the request so a background Remotion render can finish. Start with one `standard-2` instance and concurrency 1.

## Production checklist

1. Rotate any webhook URLs or tokens exposed in screenshots or chat.
2. Create an R2 token scoped only to `5waveflow-media`.
3. Add renderer environment variables without exposing values in logs.
4. Deploy the renderer to a host that supports long-running Node processes, Chromium, FFmpeg, sufficient memory, and persistent outbound HTTPS.
5. Verify `GET https://<RENDER_HOST>/health`.
6. Confirm Pages Production has the same `VIDEO_RENDER_DISPATCH_TOKEN` as this renderer.
7. Create one 30-second test job in 5WaveFlow.
8. Confirm Pages advances through all three progress states, the silent captioned MP4 exists in R2, and the project becomes completed.
9. Increase concurrency only after measuring memory and render time.
