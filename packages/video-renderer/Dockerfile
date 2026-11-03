FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/video-renderer/package.json packages/video-renderer/package.json
RUN npm ci --workspace packages/video-renderer
COPY packages/video-renderer packages/video-renderer
RUN npm run build --workspace packages/video-renderer

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates chromium ffmpeg && rm -rf /var/lib/apt/lists/*
ENV REMOTION_BROWSER_EXECUTABLE=/usr/bin/chromium
COPY package.json package-lock.json ./
COPY packages/video-renderer/package.json packages/video-renderer/package.json
RUN npm ci --omit=dev --workspace packages/video-renderer
COPY --from=build /app/packages/video-renderer/dist packages/video-renderer/dist
CMD ["node","packages/video-renderer/dist/server.js"]
