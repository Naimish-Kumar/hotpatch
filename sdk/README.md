# HotPatch React Native SDK

The native SDK for HotPatch OTA.

## Installation

```bash
npm install rn-ota-sdk
```

## Android Integration

1. Update `MainApplication.kt` (or `MainActivity.kt` in some versions):

```kotlin
import com.hotpatch.OTAPackage
import com.hotpatch.OTAUpdateManager

class MainApplication : Application(), ReactApplication {
    // ...
    override fun getJSBundleFile(): String? {
        // This will load the downloaded bundle if it exists, otherwise fall back to assets
        return OTAUpdateManager.getBundlePath(this)
    }
}
```

## iOS Integration

1. Update `AppDelegate.swift`:

```swift
import rn_ota_sdk

@objc class AppDelegate: RCTAppDelegate {
  override func sourceURL(for bridge: RCTBridge!) -> URL? {
    return OTAUpdateManager.shared.getBundleURL() ?? super.sourceURL(for: bridge)
  }
}
```

## JavaScript Usage

```typescript
import OTA from 'rn-ota-sdk';

OTA.configure({
  apiUrl: 'https://api.yourserver.com',
  appId: 'your-app-uuid',
  channel: 'production',
  checkOnLaunch: true
});

// Manual check
const update = await OTA.checkForUpdate();
if (update?.updateAvailable) {
  // apply it
  await OTA.applyUpdate();
}
```
