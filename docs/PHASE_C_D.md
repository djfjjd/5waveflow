# PHASE C–D: iOS and store release plan

## iOS implementation

- Xcode SwiftUI app with Bundle ID placeholder `com.fivewaveflow.live`.
- Shared API models mirror `packages/market-data`; use `URLSession` and no synthetic fallback values.
- Screens: Home, Live Chart, Wallpaper Preview, Customize, Favorites, Settings.
- WidgetKit: price and mini-chart timelines. Refresh cadence is requested conservatively and remains controlled by iOS.
- Static wallpaper export: render a SwiftUI chart to an image, request Photos permission only at save time, and never claim continuous iOS wallpaper updates.
- Prepare App Groups for widget preferences, accessibility labels, localization, offline last-known timestamp, signing configurations, and TestFlight.

## Store readiness

- Confirm final app name, package name, Bundle ID, icons, screenshots, support URL, privacy policy, terms, and finance disclaimer.
- Obtain written confirmation that each market-data provider permits the intended commercial display/redistribution pattern. Do not ship until confirmed.
- Complete Google Play Data Safety and Apple App Privacy from the actual telemetry/SDK inventory.
- Test Android battery use, visibility pause/resume, offline recovery, rotation, low-memory recreation, and API 26/36 devices.
- Test iOS widget timelines, Photos permission denial, Dynamic Type, VoiceOver, offline recovery, and supported iPhone/iPad sizes.
- Keep backtests and live results labeled separately. No unvalidated probability claims.
- Developer account enrollment, signing key creation, paid services, TestFlight/Play uploads, and public release require explicit user approval.
