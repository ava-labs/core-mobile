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
   - Copies the Device Farm config to `wdio.conf.ts`
   - Creates `appium-tests-devicefarm.zip` directly in the `e2e-appium` directory
   
   The zip file contains all test files, configuration, and `package.json`. AWS Device Farm will extract it and run `npm install` to install dependencies.

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

The Device Farm configuration is in `e2e-appium/wdio.devicefarm.conf.ts`. This config:
- Connects to Device Farm's Appium server (provided via environment variables)
- Uses Device Farm's app path
- Automatically detects device information from Device Farm environment variables

### Test Package Structure

The test package is created using `npm-bundle` which includes:
- All test specs (`specs/`)
- Page objects (`pages/`)
- Locators (`locators/`)
- Helpers (`helpers/`)
- TestRail integration (`testrail/`)
- Configuration files (`wdio.devicefarm.conf.ts` → `wdio.conf.ts`, `tsconfig.json`)
- `package.json` with all dependencies
- Dependencies will be installed by AWS Device Farm from `package.json`

The `package.json` in the `e2e-appium` folder defines all required dependencies. The bundling process:
1. Installs dependencies locally
2. Creates an npm bundle (`.tgz`) using `npm-bundle`
3. Zips the bundle for upload to AWS Device Farm

## Environment Variables

Device Farm provides these environment variables automatically:
- `AWS_DEVICE_FARM_APPIUM_SERVER_URL` - Appium server URL
- `AWS_DEVICE_FARM_APP_PATH` - Path to the app on the device
- `DEVICEFARM_DEVICE_NAME` - Device name
- `DEVICEFARM_DEVICE_OS_VERSION` - OS version
- `DEVICEFARM_DEVICE_PLATFORM_NAME` - Platform (Android/iOS)

## CI/CD Integration

### Bitrise Workflow Example

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
- The `npm-bundle` command will include all dependencies from `package.json`
- AWS Device Farm will run `npm install` when extracting the bundle

## Resources

- [AWS Device Farm Documentation](https://docs.aws.amazon.com/devicefarm/)
- [Appium on Device Farm](https://docs.aws.amazon.com/devicefarm/latest/developerguide/test-types-appium.html)
- [WebdriverIO Documentation](https://webdriver.io/)

