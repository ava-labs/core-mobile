# Core Mobile

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | >= 20.18 | via [volta](https://volta.sh/) or [nvm](https://github.com/nvm-sh/nvm) |
| Yarn | any launcher | delegates to the repo-pinned 3.6.4 (`corepack enable` or `brew install yarn`) |
| Xcode | latest stable | includes an iOS simulator runtime (iOS builds) |
| Ruby | 3.2.x | for CocoaPods via Bundler — `brew install ruby@3.2` or rbenv/rvm; no global CocoaPods install needed |
| JDK | 17 | e.g. `brew install --cask zulu@17` (Android builds) |
| Android Studio | latest stable | install an SDK + emulator, then export `ANDROID_HOME` (see Android section) |
| AWS CLI | v2 | for fetching env files — [install guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |

For a general reference, see the [React Native environment setup](https://reactnative.dev/docs/environment-setup).

## Setup dev environment

1. From the **repo root**, install dependencies (if you haven't):

   ```zsh
   yarn install && yarn setup
   ```

2. Fetch the `.env` files and Google services files (run from this package, or use `yarn core envs` from the root):

   ```zsh
   yarn envs
   ```

   What to expect:

   - It uses an AWS SSO profile named `sso`. If the profile doesn't exist yet, the script starts `aws configure sso` for you — get the SSO start URL, region, and role values from the [Env Workflows](https://ava-labs.atlassian.net/wiki/spaces/EN/pages/2500493313/Env+Workflows) page.
   - When the SSO session has expired, it opens a browser window to log in again.
   - On success it writes `.env`, `.env.development`, `.env.production`, `.env.internal` (+ `.e2e` variants), `android/app/google-services.json` and `ios/GoogleService-Info.plist`.

   Re-run `yarn envs` whenever you need to sync the env files.

## Build the app

### For iOS

1. Install iOS dependencies (Bundler installs the pinned CocoaPods 1.16.2 and runs `pod install`):

   ```zsh
   yarn podInstall
   ```

2. Build and launch on the iOS simulator:

   ```zsh
   yarn ios
   ```

   The first build compiles React Native core from source (see `ios/Podfile`) — expect it to take a while. `yarn ios` builds the `AvaxWalletInternal` scheme with `.env.development`. If Metro isn't started automatically, run `yarn start` in a separate terminal.

### For Android

1. Make sure the Android SDK location is set — either export it (add to your `~/.zshrc`):

   ```zsh
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
   ```

   or create `android/local.properties` with `sdk.dir=/Users/<you>/Library/Android/sdk`.

2. Start an emulator (Android Studio > Device Manager, or `emulator -avd <name>`), then build:

   ```zsh
   yarn android
   ```

   This builds the `internalDebug` variant with `.env.development`.

### Known issues

#### iOS build fails with PhaseScriptExecution failed

Check if your `.xcode.env.local` file points to a valid node binary. `yarn podInstall` may generate an invalid path, see https://github.com/facebook/react-native/issues/43285

## Common commands

```zsh
# run unit tests
yarn test

# run typescript check
yarn tsc

# run lint check
yarn lint

# fetch envs from aws and populate .env files
# do this when you first set up the project and whenever you need to sync the .env files
yarn envs

# start the Metro bundler on its own
yarn start
```

## E2E tests (Appium / WebDriverIO)

UI tests live in [`e2e/`](./e2e/) — see [`e2e/README.md`](./e2e/README.md) for how to run them, every environment variable, and the wallet funding requirements. AWS Device Farm packaging scripts live in [`scripts/devicefarm/`](./scripts/devicefarm/).

## Custom fonts

To add custom fonts, add them to the `app/assets/fonts` folder (registered in `react-native.config.js`) and then run:

```zsh
npx react-native-asset
```

## Env Workflows

[Documentation](https://ava-labs.atlassian.net/wiki/spaces/EN/pages/2500493313/Env+Workflows)
[Features requiring env variables](docs/features.md)

## Navigation System

[Documentation](https://whimsical.com/mobile-navigation-system-4WaXLt2DgAutCmbfFF6wpS)

## Wallet Connect Flows

[Documentation](https://whimsical.com/wallet-connect-flows-9QqTTDNdktBePx6vDR9oeX)

## App Signing

[Documentation](docs/app_signing.md)

## Release Process

[Documentation](docs/release_process.md)
