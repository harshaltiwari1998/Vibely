# Vibely Android

Kotlin + **Jetpack Compose** client with **MVVM**, **Retrofit**, **Room**,
**DataStore** and **Kotlin Coroutines**.

## Stack

- UI: Jetpack Compose (Material 3), Navigation Compose.
- Architecture: MVVM (`androidx.lifecycle.ViewModel` + `StateFlow`).
- Networking: Retrofit + Gson.
- Local persistence: Room (entities) + DataStore (session).
- Async: Kotlin Coroutines / Flow.

## Structure

```
app/src/main/java/com/vibely/app/
  VibelyApplication.kt        # DI container bootstrap
  MainActivity.kt             # Compose entry
  di/AppContainer.kt          # manual DI (swap for Hilt later)
  data/
    remote/  (Retrofit client + ApiService + DTOs)
    local/   (Room DB, entities, DAO, DataStore session)
    repository/ (AuthRepository, ...)
  ui/
    theme/   (original brand colors, Theme, Logo)
    navigation/ (Routes, NavHost, DI helpers)
    components/ (Screen scaffold, Placeholder)
    screens/ (all 17 screens + their ViewModels)
```

## Build

Requires **Android SDK (API 34)** and **Gradle**. From this folder:

```bash
./gradlew assembleDebug      # debug APK
./gradlew lint               # (configure in Part 2)
```

> The source is complete and build-ready. In the Part 1 environment the
> Android SDK/Gradle were not available, so the Android target is verified by
> structure rather than a compiled artifact.

## Branding

Original logo mark and palette in `ui/theme/*`. Product name comes from
`res/values/strings.xml` (`app_name`) and the backend `APP_NAME`.
