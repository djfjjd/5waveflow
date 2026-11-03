function required(name) { const value = process.env[name]?.trim(); if (!value)
    throw new Error(`${name} is required`); return value; }
function positiveInteger(name, fallback) { const parsed = Number(process.env[name] || fallback); return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback; }
export function loadConfig() {
    const appOrigin = required('APP_ORIGIN').replace(/\/$/, '');
    const parsedOrigin = new URL(appOrigin);
    if (parsedOrigin.protocol !== 'https:')
        throw new Error('APP_ORIGIN must use HTTPS');
    return {
        port: positiveInteger('PORT', 8788),
        dispatchToken: required('VIDEO_RENDER_DISPATCH_TOKEN'),
        webhookToken: required('VIDEO_RENDER_WEBHOOK_TOKEN'),
        appOrigin,
        r2Endpoint: required('R2_ENDPOINT'),
        r2AccessKeyId: required('R2_ACCESS_KEY_ID'),
        r2SecretAccessKey: required('R2_SECRET_ACCESS_KEY'),
        r2Bucket: process.env.R2_BUCKET_NAME?.trim() || '5waveflow-media',
        renderConcurrency: positiveInteger('RENDER_CONCURRENCY', 1),
        browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE?.trim() || undefined,
    };
}
