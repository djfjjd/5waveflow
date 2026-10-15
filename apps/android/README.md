# 5WaveFlow Live Android

Native Android live wallpaper built with Kotlin, Jetpack Compose, and `WallpaperService`. The wallpaper renderer uses native Canvas instead of WebView to minimize memory, avoid a persistent JavaScript runtime, and stop all refresh work when invisible.

## Requirements

- Android Studio compatible with AGP 9.4
- JDK 17
- Android SDK 36 / Build Tools 36.0.0
- Gradle 9.6

Set the production API host in `~/.gradle/gradle.properties`:

```properties
FIVEWAVEFLOW_API_BASE_URL=https://your-production-domain.example
```

Build commands:

```bash
./gradlew :app:assembleDebug
./gradlew :app:bundleRelease
```

Release signing is intentionally not committed. Configure a Play App Signing upload key through local/CI secrets before creating the release AAB.
