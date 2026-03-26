# AWS Device Farm Integration

This directory contains scripts and configuration for running Appium tests on AWS Device Farm.

## Prerequisites

1. **AWS CLI** installed and configured
   ```bash
   aws configure
   ```

2. **AWS Device Farm Project** created
   - Go to [AWS Device Farm Console](https://console.aws.amazon.com/devicefarm)
   - Create a new project or use an existing one
   - Note the Project ARN

3. **Device Pool** created
   - Create a device pool in your Device Farm project
   - Select the devices you want to test on
   - Note the Device Pool ARN

4. **App Build** ready
   - Android: `.apk` file
   - iOS: `.ipa` file
   - You can either build locally or download from Bitrise (see below)

5. **IAM user/role** with Device Farm permissions (for trigger script and Bitrise)
   - The trigger script uses the **project ARN** and **device pool ARN** to tell Device Farm where to upload files and which devices to use. These are not the IAM user ARN.
   - The IAM principal (e.g. `bitrise-devicefarm-sa`) must have the following actions allowed on the project (and related resources):

### Required IAM policy for Device Farm trigger (Bitrise / local)

Attach an IAM policy to the user or role used to run the trigger script (e.g. `bitrise-devicefarm-sa`). Without these, you will see `AccessDeniedException` for `devicefarm:CreateUpload` or similar.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "devicefarm:GetProject",
        "devicefarm:CreateUpload",
        "devicefarm:GetUpload",
        "devicefarm:ScheduleRun"
      ],
      "Resource": [
        "arn:aws:devicefarm:us-west-2:YOUR_ACCOUNT_ID:project:YOUR_PROJECT_ID",
        "arn:aws:devicefarm:us-west-2:YOUR_ACCOUNT_ID:devicepool:YOUR_POOL_ID",
        "arn:aws:devicefarm:us-west-2:YOUR_ACCOUNT_ID:upload:*"
      ]
    }
  ]
}
```

Replace `YOUR_ACCOUNT_ID`, `YOUR_PROJECT_ID`, and `YOUR_POOL_ID` with your values, or use a wildcard for the project/upload resources if you prefer. The script runs a pre-flight `GetProject` to verify credentials and access before uploading.

## Getting the APK

### Option 1: Download from Bitrise (Recommended)

Download the latest internalE2e APK from Bitrise:

```bash
cd packages/core-mobile

# Set your Bitrise credentials
export BITRISE_APP_SLUG="your-app-slug"  # Get from Bitrise dashboard URL
export BITRISE_ARTIFACTS_TOKEN="your-artifacts-token"  # Get from Bitrise Settings > API

# Download the latest build (index 0)
node scripts/devicefarm/download-bitrise-apk.js

# Or download a specific build (e.g., second latest = index 1)
node scripts/devicefarm/download-bitrise-apk.js 1

# Or specify a custom output path
node scripts/devicefarm/download-bitrise-apk.js 0 ./my-custom-path.apk
```

**Getting your Bitrise credentials:**
1. **App Slug**: Found in your Bitrise dashboard URL: `https://app.bitrise.io/app/<APP_SLUG>`
2. **Artifacts Token**: Bitrise Dashboard > Settings > API > Artifacts Access Token

The script will download the APK to: `./android/app/build/outputs/apk/internal/e2e/app-internal-e2e.apk`

### Option 2: Build Locally

Build the APK locally:

```bash
cd packages/core-mobile/android
./gradlew assembleInternalE2e
```

The APK will be at: `app/build/outputs/apk/internal/e2e/app-internal-e2e.apk`

## Setup

1. **Package the tests using npm-bundle:**
   ```bash
   cd packages/core-mobile
   ./scripts/devicefarm/package-tests.sh
   ```

   This script:
   - Temporarily copies `wdio.devicefarm.conf.ts` → `wdio.conf.ts` for the archive, then **restores** your tracked `wdio.conf.ts` on exit (so the working tree is not left dirty).
   - Creates `appium-tests-devicefarm.zip` directly in the `e2e-appium` directory.
   
   The zip file contains all test files, configuration, and `package.json`. AWS Device Farm extracts it and runs `npm install` to install dependencies.

2. **Set environment variables:**
   ```bash
   export DEVICEFARM_PROJECT_ARN="arn:aws:devicefarm:us-west-2:123456789012:project:your-project-id"
   export DEVICEFARM_DEVICE_POOL_ARN="arn:aws:devicefarm:us-west-2:123456789012:devicepool:your-pool-id"
   export DEVICEFARM_APP_PATH="/path/to/your/app.apk"
   export PLATFORM="android"  # or "ios"
   ```

## Running Tests

### Option 1: Local Development - Download APK and Trigger Tests

Use `trigger-test-run.sh` for local development. It automatically downloads the latest APK from Bitrise:

```bash
cd packages/core-mobile

# Set required environment variables
export DEVICEFARM_PROJECT_ARN="arn:aws:devicefarm:us-west-2:..."
export DEVICEFARM_DEVICE_POOL_ARN="arn:aws:devicefarm:us-west-2:..."
export BITRISE_APP_SLUG="your-app-slug"
export BITRISE_ARTIFACTS_TOKEN="your-artifacts-token"

# Download latest APK and trigger tests
./scripts/devicefarm/trigger-test-run.sh

# Or specify a branch to download APK from
./scripts/devicefarm/trigger-test-run.sh --branch feature/my-feature

# Or use an existing APK (skip download)
export DEVICEFARM_APP_PATH="/path/to/your/app.apk"
./scripts/devicefarm/trigger-test-run.sh
```

**Optional environment variables:**
- `DEVICEFARM_APP_PATH` - Path to APK (if not set, downloads from Bitrise)
- `PLATFORM` - Platform (android/ios). Default: android
- `AWS_REGION` - AWS region. Default: us-west-2

### Option 2: Bitrise CI/CD - Use Build Artifact

Use `trigger-test-run-bitrise.sh` when running in Bitrise workflows. This script uses the APK artifact from the current build:

```bash
# In Bitrise workflow, add a script step:
# File path: packages/core-mobile/scripts/devicefarm/trigger-test-run-bitrise.sh

# Required Bitrise Secrets:
# - DEVICEFARM_PROJECT_ARN
# - DEVICEFARM_DEVICE_POOL_ARN
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY

# The script automatically uses $BITRISE_APK_PATH from the build artifacts
```

**Note:** The Bitrise script expects `BITRISE_APK_PATH` to be set automatically by Bitrise when APK artifacts are available from the build.

### Option 3: Legacy Scripts

For backwards compatibility, these scripts are still available:

```bash
# Download from Bitrise and run (legacy)
./scripts/devicefarm/bitrise-to-devicefarm.sh

# Use local APK (legacy)
./scripts/devicefarm/run-devicefarm.sh
```

### Option 2: Using the script with local APK

```bash
cd packages/core-mobile
./scripts/devicefarm/run-devicefarm.sh
```

### Option 3: Manual AWS CLI commands

1. **Upload the app:**
   ```bash
   aws devicefarm create-upload \
     --project-arn "$DEVICEFARM_PROJECT_ARN" \
     --name "app.apk" \
     --type "ANDROID_APP"
   ```

2. **Upload the test package:**
   ```bash
   aws devicefarm create-upload \
     --project-arn "$DEVICEFARM_PROJECT_ARN" \
     --name "appium-tests.zip" \
     --type "APPIUM_NODE_TEST_PACKAGE"
   ```

3. **Schedule the test run:**
   ```bash
   aws devicefarm schedule-run \
     --project-arn "$DEVICEFARM_PROJECT_ARN" \
     --app-arn "$APP_UPLOAD_ARN" \
     --device-pool-arn "$DEVICEFARM_DEVICE_POOL_ARN" \
     --test type=APPIUM_NODE,testPackageArn=$TEST_UPLOAD_ARN
   ```

## Configuration

### WebdriverIO Config

- **`e2e-appium/wdio.conf.ts`** — default for local runs (`yarn appium:android` / `yarn appium:ios` from `packages/core-mobile`).
- **`e2e-appium/wdio.devicefarm.conf.ts`** — Device Farm–oriented config; copied over `wdio.conf.ts` only while building the test zip (see `package-tests.sh`).

**AWS Device Farm** — when `AWS_DEVICE_FARM_APPIUM_SERVER_URL` is set (host sets this in `aws_test_spec.yaml`), both configs:
- Connect to Device Farm’s Appium server
- Use `AWS_DEVICE_FARM_APP_PATH` / `DEVICEFARM_DEVICE_*` for app path and device capabilities

**Local runs** — when not on Device Farm, `e2e-appium/helpers/resolve-local-device.ts` fills `appium:deviceName`, `appium:platformVersion`, and `appium:udid` from the machine:
- **Android:** `adb devices` + `getprop` on the chosen device (see `ANDROID_SERIAL` if multiple devices).
- **iOS:** booted Simulator via `xcrun simctl list devices booted -j`, or a specific simulator UDID with `IOS_UDID`, or a physical device with `IOS_UDID` + `IOS_DEVICE_NAME` + `IOS_PLATFORM_VERSION`.
- **`PLATFORM` unset** (local): if `adb` shows a device, only Android caps are resolved; otherwise iOS Simulator is used.

Also set **`APP_PATH`** (or `AWS_DEVICE_FARM_APP_PATH`) to your `.apk` / `.app` when running locally.

### Test Package Structure

`package-tests.sh` zips the `e2e-appium` tree (excluding `node_modules`, lockfiles, etc.), including:
- Test specs (`specs/`), page objects (`pages/`), helpers (`helpers/`), TestRail (`testrail/`)
- `wdio.devicefarm.conf.ts` (as `wdio.conf.ts` inside the zip), `tsconfig.json`, `aws_test_spec.yaml`
- `package.json` — Device Farm runs `npm install` after extract

## Environment Variables

**On AWS Device Farm** (injected by the host — see `e2e-appium/aws_test_spec.yaml`):
- `AWS_DEVICE_FARM_APPIUM_SERVER_URL` — Appium server URL
- `AWS_DEVICE_FARM_APP_PATH` — Path to the app under test
- `DEVICEFARM_DEVICE_NAME` — Device name
- `DEVICEFARM_DEVICE_OS_VERSION` — OS version
- `DEVICEFARM_DEVICE_PLATFORM_NAME` — Platform (Android/iOS)
- `DEVICEFARM_DEVICE_UDID`, `DEVICEFARM_CHROMEDRIVER_EXECUTABLE_DIR` — as provided by Device Farm

**Local WebdriverIO** (optional overrides; see `helpers/resolve-local-device.ts`):
- `APP_PATH` — `.apk` / `.app` for `appium:app`
- `ANDROID_SERIAL`, `ADB_PATH` — Android device selection
- `IOS_UDID` — Simulator or physical device; for physical iPhones also set `IOS_DEVICE_NAME` and `IOS_PLATFORM_VERSION`
- `APPIUM_MANUAL=true` — WDIO skips starting the Appium service (use when Appium is already running)

## CI/CD Integration

### Bitrise (recommended): in-repo path step

The **`android-internal-e2e-aws-regression-run`** workflow uses a **path step** (AWS SDK v3, no deprecated marketplace upload steps):

```yaml
- path::./packages/core-mobile/scripts/bitrise/devicefarm/step:
    title: AWS Device Farm — upload & schedule run
    no_output_timeout: 1800
```

See `scripts/bitrise/devicefarm/BITRISE_SETUP.md`. **Avoid** the marketplace step **Amazon Device Farm File Deploy** (`peartherapeutics/bitrise-aws-device-farm-file-deploy`).

### Bitrise Workflow Example (alternate scripts)

You can integrate this into your Bitrise workflow. The `bitrise-to-devicefarm.sh` script handles everything:

```yaml
# Example Bitrise workflow step
- script-runner@0:
    title: Download APK and Run Device Farm Tests
    inputs:
      - file_path: packages/core-mobile/scripts/devicefarm/bitrise-to-devicefarm.sh
    envs:
      - BITRISE_APP_SLUG: $BITRISE_APP_SLUG  # Automatically set by Bitrise
      - BITRISE_ARTIFACTS_TOKEN: $BITRISE_ARTIFACTS_TOKEN  # Set in Bitrise secrets
      - DEVICEFARM_PROJECT_ARN: $DEVICEFARM_PROJECT_ARN
      - DEVICEFARM_DEVICE_POOL_ARN: $DEVICEFARM_DEVICE_POOL_ARN
      - AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID
      - AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY
      - WAIT_FOR_COMPLETION: "false"  # Set to "true" to wait for completion
```

**Or use the existing APK from the current build:**

```yaml
- script-runner@0:
    title: Run Device Farm Tests
    inputs:
      - file_path: packages/core-mobile/scripts/devicefarm/run-devicefarm.sh
    envs:
      - DEVICEFARM_PROJECT_ARN: $DEVICEFARM_PROJECT_ARN
      - DEVICEFARM_DEVICE_POOL_ARN: $DEVICEFARM_DEVICE_POOL_ARN
      - DEVICEFARM_APP_PATH: $BITRISE_APK_PATH  # Use APK from current build
      - PLATFORM: android
```

## Troubleshooting

### Test package too large
- Device Farm has a 4GB limit for test packages
- `npm-bundle` only includes production dependencies
- Check the bundle size before uploading
- Consider removing unnecessary test files if needed

### App upload fails
- Ensure the app file is valid (not corrupted)
- Check file permissions
- Verify AWS credentials have Device Farm permissions

### Tests fail to connect
- Verify Device Farm environment variables are set
- Check Appium server URL is correct
- Ensure app path is valid

### Dependencies missing
- Ensure all dependencies are listed in `e2e-appium/package.json`
- AWS Device Farm will run `npm install` when extracting the test zip

### Local run: “No Android device” or “No booted iOS Simulator”
- Android: start an emulator or plug in a device; confirm `adb devices` shows `device`.
- iOS: open Simulator and boot a device, or set `IOS_UDID` to a simulator UDID (`xcrun simctl list devices`).

## Resources

- [AWS Device Farm Documentation](https://docs.aws.amazon.com/devicefarm/)
- [Appium on Device Farm](https://docs.aws.amazon.com/devicefarm/latest/developerguide/test-types-appium.html)
- [WebdriverIO Documentation](https://webdriver.io/)

