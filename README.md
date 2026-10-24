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
- 환경변수: `BINANCE_API_BASE=https://data-api.binance.vision`
- iOS 단축어 원클릭 설치 링크: `VITE_IOS_SHORTCUT_URL=https://www.icloud.com/shortcuts/...`
- SPA 경로는 Cloudflare Pages의 기본 fallback 동작으로 처리됩니다.

현재 Pages 프로젝트처럼 Build command가 비어 있어도 첫 배포가 가능하도록 검증된 `dist` 산출물을 저장소에 포함합니다. 권장 운영 설정은 Pages의 **Settings → Build → Build configurations**에서 Build command를 `npm run build`로 지정하는 것입니다. 설정 후에는 Cloudflare가 매 배포마다 소스에서 새 산출물을 생성합니다.

현재 초기 배포가 가짜 UUID 때문에 실패하지 않도록 D1 바인딩은 `wrangler.jsonc`에서 제외되어 있습니다. 데이터베이스를 생성한 뒤 Cloudflare Pages의 **Settings → Bindings → D1 database bindings**에서 변수 이름 `DB`로 `5waveflow` 데이터베이스를 연결하세요. 또는 `wrangler.jsonc`에 `d1_databases` 항목을 추가할 때 `wrangler d1 create`가 반환한 실제 UUID만 사용해야 합니다.

```bash
npx wrangler d1 create 5waveflow
npx wrangler d1 migrations apply 5waveflow --local
npx wrangler d1 migrations apply 5waveflow --remote
```

D1 연결 전에도 공개 시장 데이터 페이지와 Functions는 배포되며, 관리자 상태 응답의 `databaseBound` 값은 `false`입니다.

## Admin security

Cloudflare Zero Trust에서 `/admin*`, `/api/admin*`을 보호하는 Access Application을 만들고 Pages 환경변수 `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`를 설정해야 합니다. 설정 전 관리자 API는 503으로 닫힙니다. 관리자 API는 Access JWKS의 RS256 서명, issuer, audience, 만료 시각을 서버에서 검증합니다.

### SNS 원클릭 업로드

`/admin/publish`는 선택한 SNS 채널, 공개 HTTPS 미디어 URL, 제목, 본문을 발행 Webhook으로 한 번에 전달합니다. Cloudflare Pages 프로젝트에 아래 두 값을 **Encrypt**로 추가하세요.

- `SNS_PUBLISH_WEBHOOK_URL`: Cloudflare Worker, Make 또는 n8n의 HTTPS 발행 엔드포인트
- `SNS_PUBLISH_WEBHOOK_TOKEN`: Webhook이 `Authorization: Bearer ...`로 검증할 긴 임의 문자열

Webhook은 `jobId`, `platforms`, `mediaUrl`, `title`, `caption`, `requestedAt` JSON을 받고 성공 시 HTTP 2xx를 반환해야 합니다. 실제 게시를 위해 Webhook 측에 Meta(Instagram·Threads), Google(YouTube), TikTok, X 계정 OAuth 토큰과 각 플랫폼 게시 권한을 연결합니다. 플랫폼 토큰은 프런트엔드나 이 저장소에 넣지 마세요.

## Current scope

- Binance 공개 시장 데이터 API 기반 BTC/ETH 24시간 시세 및 최근 500개 OHLCV, Cloudflare 환경에서 Binance가 차단될 경우 Upbit KRW OHLCV 자동 폴백
- 실제 캔들 기반 RSI(14), MACD(12,26,9), EMA(20·50·200), Bollinger(20,2), ATR(14), 거래량 MA(20)
- ATR 적응형 ZigZag와 Elliott 1~5/ABC 규칙 검증, 가격·거래량 기반 Wyckoff 이벤트 및 Phase 후보 분석
- Elliott 결과는 일봉·4시간·1시간·30분·15분 후보를 순차 집계해 다중 시간대 방향 합의를 표시
- 분석 페이지 종목 선택기로 BTC·ETH·SOL·XRP의 TradingView 차트와 정량 분석 결과를 함께 전환
- KRX·NASDAQ·NYSE 종목은 Yahoo Finance OHLCV를 통해 동일한 지표·Elliott·Wyckoff 엔진으로 분석
- 패턴 분석은 확정 캔들만 사용하며 진행 중 피벗과 데이터 신선도를 별도로 표시
- Lightweight Charts 캔들·거래량 및 EMA 20·50·200/Bollinger 선택 오버레이
- TradingView 공식 Advanced Chart 임베드 위젯(BTC/USDT 캔들 차트, 종목·시간대 변경)
- 상단 실시간 숫자 시세(Binance BTC/USDT, Upbit BTC/KRW 전체 원화 금액, USD/KRW)
- 모바일 화면 최상단 Pull-to-Refresh
- RSI, MACD, EMA, ATR, Bollinger 계산 기반
- Elliott/Wyckoff는 확정 판정이 아닌 후보 설명만 제공
- 검증된 모델이 없으므로 상승/횡보/하락 확률은 의도적으로 미표시
- 주식, 영상 렌더링, 유료 구독은 준비 중 상태. SNS 게시는 관리자 Webhook 연동 방식 제공

SNS API는 플랫폼별 앱 심사와 권한이 필요합니다. Instagram은 Meta App/Instagram Graph API, YouTube는 Google OAuth 및 YouTube Data API, TikTok은 Content Posting API 승인, X는 API 쓰기 권한, Threads는 Meta Threads API 권한을 준비해야 합니다.

## Commands

`npm run typecheck` · `npm test` · `npm run build`

## 5WaveFlow Live workspace

- `apps/web` — 기존 웹 앱을 루트에서 유지하며 점진적으로 이전하기 위한 안내
- `apps/android` — Kotlin/Jetpack Compose 설정 앱과 네이티브 Canvas `WallpaperService`
- `apps/ios` — PHASE C용 SwiftUI/WidgetKit 계획
- `packages/market-data` — 공통 종목·시간봉·API 요청 계약
- `packages/wallpaper` — 공통 프리셋과 테마 계약

웹 미리보기는 `/wallpaper`에서 확인합니다. Android 빌드에는 JDK 17과 Android SDK 36이 필요하며, API 주소는 `FIVEWAVEFLOW_API_BASE_URL` Gradle 속성으로 지정할 수 있습니다. 데이터 공급자별 상업 이용 확인 사항은 [`docs/DATA_LICENSING.md`](docs/DATA_LICENSING.md)에 기록했습니다.

본 서비스는 투자 자문이나 수익 보장을 제공하지 않습니다.
