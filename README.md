# 5WaveFlow / 5파플로우

실제 시장 데이터와 검증 가능한 분석을 우선하는 글로벌 금융시장 분석 플랫폼입니다. PHASE 1 기반은 React/Vite 프런트엔드, Cloudflare Pages Functions, D1로 구성합니다.

## Local development

```bash
npm install
npx wrangler pages dev dist --compatibility-date=2026-10-01
```

프런트엔드만 작업할 때는 `npm run dev`를 사용합니다. Pages Functions까지 함께 확인하려면 먼저 `npm run build` 후 Wrangler Pages dev를 실행하세요.

## Cloudflare Pages

- Build command: `npm run build`
- Build output: `dist`
- Node.js: 20 이상
- Production branch: `main`
- 환경변수: `BINANCE_API_BASE=https://api.binance.com`
- SPA fallback은 `public/_redirects`에 설정되어 있습니다.

`wrangler.jsonc`의 `REPLACE_WITH_D1_DATABASE_ID`를 실제 D1 ID로 교체합니다.

```bash
npx wrangler d1 create 5waveflow
npx wrangler d1 migrations apply 5waveflow --local
npx wrangler d1 migrations apply 5waveflow --remote
```

## Admin security

Cloudflare Zero Trust에서 `/admin*`, `/api/admin*`을 보호하는 Access Application을 만들고 Pages 환경변수 `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`를 설정해야 합니다. 설정 전 관리자 API는 503으로 닫힙니다. 관리자 API는 Access JWKS의 RS256 서명, issuer, audience, 만료 시각을 서버에서 검증합니다.

## Current scope

- Binance 공개 API 기반 BTC/ETH 24시간 시세 및 OHLCV
- Lightweight Charts 캔들/거래량/EMA 20·50
- RSI, MACD, EMA, ATR, Bollinger 계산 기반
- Elliott/Wyckoff는 확정 판정이 아닌 후보 설명만 제공
- 검증된 모델이 없으므로 상승/횡보/하락 확률은 의도적으로 미표시
- 주식, 영상 렌더링, SNS OAuth/게시, 유료 구독은 준비 중 상태

SNS API는 플랫폼별 앱 심사와 권한이 필요합니다. Instagram은 Meta App/Instagram Graph API, YouTube는 Google OAuth 및 YouTube Data API, TikTok은 Content Posting API 승인, X는 API 쓰기 권한, Threads는 Meta Threads API 권한을 준비해야 합니다.

## Commands

`npm run typecheck` · `npm test` · `npm run build`

본 서비스는 투자 자문이나 수익 보장을 제공하지 않습니다.
