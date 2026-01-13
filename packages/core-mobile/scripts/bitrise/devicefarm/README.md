# Bitrise Device Farm Integration

This directory contains scripts for running Appium tests on AWS Device Farm from Bitrise CI.

## Bitrise Workflow: `android-devicefarm-regression-run`

This workflow:
1. Builds the Android app (internal E2E variant)
2. Packages the Appium tests
3. Uploads and runs tests on AWS Device Farm using the AWS SDK (Node.js API)
4. Sends test result notifications to Slack

## How It Works

The workflow uses the Node.js API script (`trigger-devicefarm-api.js`) which:
- Uses the AWS SDK for JavaScript to interact with Device Farm
- Uploads the app, test package, and test spec via API
- Schedules the test run programmatically
- Provides better error handling and logging

## Prerequisites

### Bitrise Environment Variables

Set these in your Bitrise project settings:

**Required:**
- `DEVICEFARM_PROJECT_ARN` - AWS Device Farm project ARN
  - Format: `arn:aws:devicefarm:us-west-2:123456789012:project:your-project-id`
- `DEVICEFARM_DEVICE_POOL_ARN` - Device pool ARN
  - Format: `arn:aws:devicefarm:us-west-2:123456789012:devicepool:your-pool-id`
- `AWS_ACCESS_KEY_ID` - AWS access key with Device Farm permissions
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key

**Optional:**
- `AWS_DEFAULT_REGION` - AWS region (defaults to `us-west-2`)
- `AWS_SESSION_TOKEN` - For temporary credentials
- `WAIT_FOR_COMPLETION` - Set to `true` to wait for test completion (default: `true`)

### Bitrise Stack Requirements

The workflow requires:
- **Node.js 20.19.0+** - Handled by `_install-and-set-env` workflow
- **npm** - Comes with Node.js
- **AWS SDK** - Installed automatically via `npm install @aws-sdk/client-device-farm`

**Note:** The workflow no longer requires AWS CLI or jq, as it uses the AWS SDK directly.

## Usage

### Trigger the Workflow

The workflow can be triggered:

1. **Manually** from Bitrise dashboard
   - Go to your Bitrise app
   - Click "Start/Schedule a Build"
   - Select the `android-devicefarm-regression-run` workflow

2. **Via Bitrise API** (Programmatic trigger)
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
         "workflow_id": "android-devicefarm-regression-run",
         "branch": "main"
       }
     }'
   ```

3. **Via webhook** (if configured in Bitrise)
   - Set up a webhook in Bitrise settings
   - Configure it to trigger on specific events (push, PR, etc.)

4. **On branch push** (if configured in workflow triggers)
   - Add workflow triggers in `bitrise.yml` or Bitrise dashboard

### Getting Your Bitrise API Token

1. Go to Bitrise dashboard
2. Click on your profile → Account Settings
3. Go to "Security" → "API Tokens"
4. Create a new token with appropriate permissions
5. Use this token in API requests

### Workflow Steps

1. **`_install-and-set-env`** - Installs Node.js and sets up environment
2. **`_set-version`** - Sets app version and build number
3. **`_build-android-internal-for-testing`** - Builds the Android APK
4. **Run Device Farm Tests** - Packages and runs tests on Device Farm
5. **`_send-test-result-notification-slack`** - Sends results to Slack

## Monitoring Test Runs

Test runs are monitored in real-time. The script will:
- Upload the app to Device Farm
- Upload the test package
- Schedule the test run
- Wait for completion (if `WAIT_FOR_COMPLETION=true`)
- Report results

View test runs in the [AWS Device Farm Console](https://console.aws.amazon.com/devicefarm).

## Troubleshooting

### AWS CLI not found
- Add AWS CLI installation step before the workflow
- Or use a Bitrise stack that includes AWS CLI

### AWS credentials not working
- Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set correctly
- Check that the credentials have Device Farm permissions
- Verify the AWS region is correct

### Test package too large
- Device Farm has a 4GB limit
- Consider excluding unnecessary files from the package
- Use `npm ci --production` to reduce node_modules size

### Tests fail to connect
- Verify Device Farm environment variables are set correctly
- Check that the app was uploaded successfully
- Review Device Farm logs in the AWS console

## Cost Considerations

AWS Device Farm charges based on:
- Device minutes used
- Number of test runs
- Storage for artifacts

Monitor costs in the AWS Billing Console and set up billing alerts.

## Related Documentation

- [AWS Device Farm Documentation](https://docs.aws.amazon.com/devicefarm/)
- [Bitrise Documentation](https://devcenter.bitrise.io/)
- [Main Device Farm README](../devicefarm/README.md)

