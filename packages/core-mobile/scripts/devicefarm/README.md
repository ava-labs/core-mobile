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

### Option 1: Using the script (recommended)

```bash
cd packages/core-mobile
./scripts/devicefarm/run-devicefarm.sh
```

### Option 2: Manual AWS CLI commands

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

You can integrate this into your CI/CD pipeline:

```yaml
# Example Bitrise step
- script-runner@0:
    title: Package Device Farm Tests
    inputs:
      - file_path: scripts/devicefarm/package-tests.sh
- script-runner@0:
    title: Run Device Farm Tests
    inputs:
      - file_path: scripts/devicefarm/run-devicefarm.sh
    envs:
      - DEVICEFARM_PROJECT_ARN: $DEVICEFARM_PROJECT_ARN
      - DEVICEFARM_DEVICE_POOL_ARN: $DEVICEFARM_DEVICE_POOL_ARN
      - DEVICEFARM_APP_PATH: $BITRISE_APK_PATH
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

