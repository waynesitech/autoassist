# Building Android APK

## Prerequisites
- EAS CLI is installed and you're logged in (already done ✓)
- Project is initialized with EAS (already done ✓)

## Switching Expo account (username/password) for Android builds

EAS builds run **under whichever Expo account you are authenticated as**.

- **Local builds (interactive)**:
  - `eas logout`
  - `eas login` (enter the new Expo username/password when prompted)

- **CI / non-interactive builds (recommended)**:
  - Create an **Expo Access Token** in the target account on the Expo dashboard (Account Settings → Access Tokens)
  - Set it as an environment variable/secret: `EXPO_TOKEN=...`
  - Run builds normally (EAS CLI will use `EXPO_TOKEN` automatically)

Important:
- **Android keystore is tied to the EAS project**. If you switch to a different Expo account that **does not own** (or isn’t a member of) this EAS project, builds will fail until you either:
  - add the new account as a member/collaborator, or
  - transfer the project ownership, or
  - create a new EAS project (this will usually generate a new keystore, which breaks Play Store updates for an existing app).

## Build Commands

### For Preview/Development APK:
```bash
cd mobile
npm run build:android
# OR
eas build --platform android --profile preview
```

### For Production APK:
```bash
cd mobile
npm run build:android:prod
# OR
eas build --platform android --profile production
```

## First Time Build
When you run the build for the first time, EAS will ask:
- **"Generate a new Android Keystore?"** - Answer **"y"** (yes)

This will automatically generate and securely store your keystore on Expo's servers.

⚠️ **Important: New EAS Project Created**
- This project has been re-initialized under the `waynewan` account (new project ID: `083e9654-2f06-484c-9ae1-09fc0864a8ca`)
- **If you previously published this app to Google Play Store**, the new keystore will be different from the old one
- **This means you cannot update an existing app on Play Store** - you would need to publish as a new app
- If you need to keep the same keystore, you must migrate it from the old EAS project or use the old account

## Build Process
1. The build will be queued on Expo's servers
2. You'll get a build URL to track progress
3. Once complete, you can download the APK from the Expo dashboard or via the provided link
4. The build typically takes 10-20 minutes

## Download APK
After the build completes:
- Check the terminal output for the download link
- Or visit: `https://expo.dev/accounts/waynewan/projects/autoassist-mobile/builds`

## Alternative: Local Build
If you prefer to build locally (requires Android Studio and more setup):
```bash
npx expo prebuild
cd android
./gradlew assembleRelease
```
