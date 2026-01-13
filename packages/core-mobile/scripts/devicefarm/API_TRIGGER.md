# Triggering AWS Device Farm Tests via API

There are several ways to trigger test runs on AWS Device Farm:

## 1. AWS CLI (Current Method - `run-devicefarm.sh`)

The existing script uses AWS CLI, which calls the AWS API under the hood:

```bash
./scripts/devicefarm/run-devicefarm.sh
```

**Pros:**
- Simple and straightforward
- Already implemented and working
- Good for shell scripts and CI/CD

**Cons:**
- Requires AWS CLI installation
- Less programmatic control

## 2. AWS SDK for JavaScript (Node.js)

A Node.js script that uses the AWS SDK directly:

```bash
# Install AWS SDK (if not already installed)
npm install @aws-sdk/client-device-farm

# Run the script
node scripts/devicefarm/trigger-devicefarm-api.js \
  --project-arn "arn:aws:devicefarm:us-west-2:123456789012:project:your-project" \
  --device-pool-arn "arn:aws:devicefarm:us-west-2:123456789012:devicepool:your-pool" \
  --app-path "/path/to/app.apk" \
  --test-package-path "/path/to/appium-tests-devicefarm.zip" \
  --test-spec-path "/path/to/aws_test_spec.yaml" \
  --platform "android"
```

Or using environment variables:

```bash
export DEVICEFARM_PROJECT_ARN="arn:aws:devicefarm:..."
export DEVICEFARM_DEVICE_POOL_ARN="arn:aws:devicefarm:..."
export DEVICEFARM_APP_PATH="/path/to/app.apk"
export DEVICEFARM_TEST_PACKAGE_PATH="/path/to/appium-tests-devicefarm.zip"
export DEVICEFARM_TEST_SPEC_PATH="/path/to/aws_test_spec.yaml"
export PLATFORM="android"

node scripts/devicefarm/trigger-devicefarm-api.js
```

**Pros:**
- Full programmatic control
- Can be integrated into Node.js applications
- Better error handling and async/await support
- Can be used as a module in other scripts

**Cons:**
- Requires Node.js and AWS SDK
- More code to maintain

## 3. Direct HTTP API Calls (REST API)

You can also call the AWS Device Farm API directly using HTTP requests:

```bash
# Example using curl (requires AWS Signature Version 4 signing)
# This is complex - better to use AWS CLI or SDK
```

**Note:** Direct HTTP calls require AWS Signature Version 4 signing, which is complex. It's recommended to use AWS CLI or SDK instead.

## 4. AWS SDK for Python

If you prefer Python:

```python
import boto3

devicefarm = boto3.client('devicefarm', region_name='us-west-2')

# Create upload for app
app_upload = devicefarm.create_upload(
    projectArn='arn:aws:devicefarm:...',
    name='app.apk',
    type='ANDROID_APP'
)

# Upload file to presigned URL
# ... upload logic ...

# Schedule run
run = devicefarm.schedule_run(
    projectArn='arn:aws:devicefarm:...',
    appArn=app_upload['upload']['arn'],
    devicePoolArn='arn:aws:devicefarm:...',
    name='Test Run',
    test={
        'type': 'APPIUM_NODE',
        'testPackageArn': 'arn:aws:devicefarm:...'
    }
)
```

## 5. From Bitrise CI/CD

The Bitrise workflow already triggers tests via the shell script, which uses AWS CLI. You can also:

1. **Use the Node.js script in Bitrise:**
   ```yaml
   - script@1:
       inputs:
         - content: |
             npm install @aws-sdk/client-device-farm
             node scripts/devicefarm/trigger-devicefarm-api.js
   ```

2. **Use Bitrise API to trigger the workflow:**
   ```bash
   curl -X POST \
     "https://api.bitrise.io/v0.1/apps/{APP_SLUG}/builds" \
     -H "Authorization: token $BITRISE_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "hook_info": {
         "type": "bitrise"
       },
       "build_params": {
         "workflow_id": "android-devicefarm-regression-run"
       }
     }'
   ```

## Key AWS Device Farm API Operations

The main operations used:

1. **`CreateUpload`** - Creates an upload slot for app/test package/test spec
2. **`GetUpload`** - Checks upload status
3. **`ScheduleRun`** - Schedules the test run

## Authentication

All methods require AWS credentials configured:

- **AWS CLI:** `aws configure` or environment variables
- **AWS SDK:** Uses default credential chain (env vars, IAM role, ~/.aws/credentials)
- **Direct API:** Requires AWS Signature Version 4 signing

## Recommended Approach

- **For CI/CD (Bitrise):** Use the existing shell script (`run-devicefarm.sh`) - it's simple and works well
- **For programmatic integration:** Use the Node.js script (`trigger-devicefarm-api.js`) if you need more control
- **For Python projects:** Use boto3 SDK

## Example: Using Node.js Script in CI/CD

```yaml
# bitrise.yml
- script@1:
    title: Trigger Device Farm Tests
    inputs:
      - content: |
          cd packages/core-mobile
          npm install @aws-sdk/client-device-farm
          node scripts/devicefarm/trigger-devicefarm-api.js
    envs:
      - DEVICEFARM_PROJECT_ARN: $DEVICEFARM_PROJECT_ARN
      - DEVICEFARM_DEVICE_POOL_ARN: $DEVICEFARM_DEVICE_POOL_ARN
      - DEVICEFARM_APP_PATH: $BITRISE_APK_PATH
      - DEVICEFARM_TEST_PACKAGE_PATH: e2e-appium/appium-tests-devicefarm.zip
      - DEVICEFARM_TEST_SPEC_PATH: e2e-appium/aws_test_spec.yaml
      - PLATFORM: android
```




