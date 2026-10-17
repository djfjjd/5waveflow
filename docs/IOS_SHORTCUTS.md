# iOS wallpaper shortcut

## Publish the one-click install link

1. Build and test the complete shortcut on an iPhone. Use the exact name **5WaveFlow Wallpaper**.
2. In the shortcut editor, open Share and choose **Copy iCloud Link**. Apple receives a copy for validation and returns a URL shaped like `https://www.icloud.com/shortcuts/...`.
3. In Cloudflare Pages, add the build environment variable `VITE_IOS_SHORTCUT_URL` with that complete URL.
4. Trigger a new site build. The `/wallpaper` page validates that the URL belongs to the iCloud shortcut path before showing the **5WaveFlow 단축어 원클릭 설치** button.

Visitors still see Apple's shortcut preview and tap **Get Shortcut**. This is Apple's supported one-click sharing flow; silent installation isn't supported.

## Supported flow

1. Open `/wallpaper`, choose the settings, and tap **URL 복사하고 단축어 만들기**. The button copies the generated image URL and opens `shortcuts://create-shortcut`.
2. In the opened editor, add **URL** and paste, then add **Get Contents of URL** using GET.
3. Pass its image output to **Set Wallpaper Photo** and choose the intended Lock Screen or Home Screen wallpaper.
4. Save the shortcut with the exact name **5WaveFlow Wallpaper**. The site can then launch it with `shortcuts://run-shortcut?name=5WaveFlow%20Wallpaper`.
5. Test the shortcut manually before adding a personal automation.
6. Leave the shortcut editor. Open the bottom **Automation** tab, tap **+**, choose **Create Personal Automation**, then select the Korean trigger named **특정 시간** (Time of Day). This is a trigger, not an action to search for inside the shortcut.
7. Do not choose **표준 시간대로 변경**. That action only converts a date between time zones and does not schedule the shortcut.
8. Create a separate **특정 시간** automation for each desired execution time. Enable automatic execution only when that option is available and acceptable on the device.

The server returns a 1170×2535 PNG (9:19.5) generated from current BTC/ETH OHLCV. The lock-screen clock region is intentionally left clear.

Until `VITE_IOS_SHORTCUT_URL` is registered, the website falls back to copying the configured URL and opening the shortcut editor. After registration, the Apple-validated iCloud share page becomes the primary installation path.

## Platform limits

- The 1–60 minute setting controls foreground refresh and response caching; it cannot create an iOS repeating timer.
- **특정 시간** is a scheduled trigger under the Automation tab. Multiple daily updates require multiple automations.
- Automatic execution and wallpaper changes can depend on the iOS version, lock state, user permissions, and action settings.
- WidgetKit is separate. Its requested timeline date is not a guaranteed execution date, and the system applies a refresh budget.
