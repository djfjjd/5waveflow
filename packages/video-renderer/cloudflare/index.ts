import { Container } from '@cloudflare/containers';

interface Env {
  VIDEO_RENDERER: DurableObjectNamespace<VideoRendererContainer>;
  VIDEO_RENDER_DISPATCH_TOKEN: string;
  VIDEO_RENDER_WEBHOOK_TOKEN: string;
  R2_ENDPOINT: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
}

export class VideoRendererContainer extends Container<Env> {
  defaultPort = 8788;
  sleepAfter = '30m';
  enableInternet = true;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.envVars = {
      PORT: '8788',
      APP_ORIGIN: 'https://5waveflow.pages.dev',
      VIDEO_RENDER_DISPATCH_TOKEN: env.VIDEO_RENDER_DISPATCH_TOKEN,
      VIDEO_RENDER_WEBHOOK_TOKEN: env.VIDEO_RENDER_WEBHOOK_TOKEN,
      R2_ENDPOINT: env.R2_ENDPOINT,
      R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME: '5waveflow-media',
      RENDER_CONCURRENCY: '1',
      REMOTION_BROWSER_EXECUTABLE: '/usr/bin/chromium',
    };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/health' && url.pathname !== '/render') {
      return new Response('Not found', { status: 404 });
    }

    // Bump the durable-object instance when renderer secrets are rotated so a
    // sleeping container cannot resume with stale environment variables.
    const renderer = env.VIDEO_RENDERER.getByName('production-v2');
    return renderer.fetch(request);
  },
} satisfies ExportedHandler<Env>;
