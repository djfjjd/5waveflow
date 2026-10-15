# iOS wallpaper shortcut

## Supported flow

1. Open `/wallpaper` and choose symbol, interval, theme, and desired refresh interval.
2. Copy the generated `/api/wallpaper` image URL.
3. In Shortcuts, add **URL**, then **Get Contents of URL** using GET.
4. Pass its image output to **Set Wallpaper Photo** and choose the intended Lock Screen or Home Screen wallpaper.
5. Test the shortcut manually before adding a personal automation.
6. Add a **Time of Day** personal automation for each desired execution time. Enable automatic execution only when that option is available and acceptable on the device.

The server returns a 1170×2535 PNG (9:19.5) generated from current BTC/ETH OHLCV. The lock-screen clock region is intentionally left clear.

## Platform limits

- The 1–60 minute setting controls foreground refresh and response caching; it cannot create an iOS repeating timer.
- Time of Day is a scheduled trigger. Multiple daily updates require multiple automation times.
- Automatic execution and wallpaper changes can depend on the iOS version, lock state, user permissions, and action settings.
- WidgetKit is separate. Its requested timeline date is not a guaranteed execution date, and the system applies a refresh budget.
