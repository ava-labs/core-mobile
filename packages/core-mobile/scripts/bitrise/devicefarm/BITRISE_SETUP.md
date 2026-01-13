# Bitrise Environment Variables Setup for Device Farm

This document lists all the environment variables and secrets you need to configure in Bitrise to run Device Farm tests.

## How to Set Environment Variables in Bitrise

1. Go to your Bitrise app dashboard
2. Click on **"Workflows"** → **"Secrets"** (or **"Code"** → **"Secrets"**)
3. Click **"+ Add new"** to add each secret
4. Mark sensitive values (like AWS keys) as **"Is exposed?" = NO** (they'll be hidden in logs)

## Required Environment Variables

### AWS Credentials (Required)

These are used to authenticate with AWS Device Farm:

- **`AWS_ACCESS_KEY_ID`**
  - Type: Secret (mark as sensitive)
  - Description: AWS access key ID with Device Farm permissions
  - Example: `AKIAIOSFODNN7EXAMPLE`
  - **⚠️ Mark as "Is exposed? = NO" to hide in logs**

- **`AWS_SECRET_ACCESS_KEY`**
  - Type: Secret (mark as sensitive)
  - Description: AWS secret access key
  - Example: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
  - **⚠️ Mark as "Is exposed? = NO" to hide in logs**

### Device Farm Configuration (Required)

- **`DEVICEFARM_PROJECT_ARN`**
  - Type: Environment Variable
  - Description: AWS Device Farm project ARN
  - Format: `arn:aws:devicefarm:us-west-2:123456789012:project:your-project-id`
  - How to find: AWS Console → Device Farm → Your Project → Project Settings → ARN
  - Example: `arn:aws:devicefarm:us-west-2:123456789012:project:abc123def456`

- **`DEVICEFARM_DEVICE_POOL_ARN`**
  - Type: Environment Variable
  - Description: Device pool ARN where tests will run
  - Format: `arn:aws:devicefarm:us-west-2:123456789012:devicepool:your-pool-id`
  - How to find: AWS Console → Device Farm → Your Project → Device Pools → Select pool → ARN
  - Example: `arn:aws:devicefarm:us-west-2:123456789012:devicepool:xyz789ghi012`

## Optional Environment Variables

These have defaults but can be customized:

- **`AWS_DEFAULT_REGION`** (Optional)
  - Type: Environment Variable
  - Description: AWS region for Device Farm
  - Default: `us-west-2`
  - Example: `us-west-2`

- **`AWS_REGION`** (Optional)
  - Type: Environment Variable
  - Description: Alternative to AWS_DEFAULT_REGION
  - Default: `us-west-2` (if AWS_DEFAULT_REGION not set)
  - Example: `us-west-2`

- **`AWS_SESSION_TOKEN`** (Optional)
  - Type: Secret (mark as sensitive)
  - Description: Required only if using temporary AWS credentials
  - Example: `FQoGZXIvYXdzE...` (long token)
  - **⚠️ Mark as "Is exposed? = NO" to hide in logs**

- **`WAIT_FOR_COMPLETION`** (Optional)
  - Type: Environment Variable
  - Description: Whether to wait for test completion before finishing
  - Default: `true`
  - Values: `true` or `false`
  - Note: Currently the script triggers the run but doesn't wait (can be enhanced)

## Automatically Set Variables

These are set automatically by Bitrise or the workflow - **you don't need to configure them**:

- **`BITRISE_APK_PATH`** - Set automatically by `_build-android-internal-for-testing` workflow
- **`BITRISE_SOURCE_DIR`** - Set automatically by Bitrise
- **`DEVICEFARM_APP_PATH`** - Set to `$BITRISE_APK_PATH` in the script
- **`DEVICEFARM_TEST_PACKAGE_PATH`** - Set automatically to `e2e-appium/appium-tests-devicefarm.zip`
- **`DEVICEFARM_TEST_SPEC_PATH`** - Set automatically to `e2e-appium/aws_test_spec.yaml`
- **`PLATFORM`** - Set automatically to `android` in the script

## Quick Setup Checklist

- [ ] `AWS_ACCESS_KEY_ID` - AWS access key (Secret, not exposed)
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS secret key (Secret, not exposed)
- [ ] `DEVICEFARM_PROJECT_ARN` - Device Farm project ARN
- [ ] `DEVICEFARM_DEVICE_POOL_ARN` - Device pool ARN
- [ ] `AWS_DEFAULT_REGION` - AWS region (optional, defaults to `us-west-2`)

## Finding Your ARNs

### Project ARN
1. Go to [AWS Device Farm Console](https://console.aws.amazon.com/devicefarm)
2. Select your project
3. Click on **"Project settings"** or look at the URL
4. The ARN is in the format: `arn:aws:devicefarm:us-west-2:ACCOUNT_ID:project:PROJECT_ID`

### Device Pool ARN
1. In your Device Farm project, go to **"Device pools"**
2. Select the pool you want to use (or create a new one)
3. Click on the pool name
4. The ARN is shown in the pool details or in the URL
5. Format: `arn:aws:devicefarm:us-west-2:ACCOUNT_ID:devicepool:POOL_ID`

## AWS IAM Permissions

Your AWS credentials need the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "devicefarm:CreateUpload",
        "devicefarm:GetUpload",
        "devicefarm:ScheduleRun",
        "devicefarm:GetRun",
        "devicefarm:ListRuns"
      ],
      "Resource": "*"
    }
  ]
}
```

Or use the AWS managed policy: `DeviceFarmFullAccess` (if you want full access)

## Testing Your Setup

After setting up the environment variables:

1. Go to Bitrise dashboard
2. Click **"Start/Schedule a Build"**
3. Select workflow: `android-devicefarm-regression-run`
4. Click **"Start Build"**
5. Monitor the build logs to verify:
   - AWS credentials are working
   - ARNs are correctly formatted
   - Files are being uploaded
   - Test run is scheduled

## Troubleshooting

### "AWS credentials not found"
- Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set
- Check that they're marked as secrets (not exposed)
- Verify the credentials have Device Farm permissions

### "DEVICEFARM_PROJECT_ARN not set"
- Verify the environment variable name is exactly `DEVICEFARM_PROJECT_ARN`
- Check that it's set at the app level (not just workflow level)
- Verify the ARN format is correct

### "DEVICEFARM_DEVICE_POOL_ARN not set"
- Same as above - verify variable name and ARN format

### "Access Denied" errors
- Check IAM permissions for your AWS credentials
- Verify the credentials have Device Farm access
- Check that the region matches your Device Farm project region

## Security Best Practices

1. **Never commit secrets to git** - Always use Bitrise secrets
2. **Mark sensitive values as "not exposed"** - This prevents them from appearing in logs
3. **Use IAM roles with least privilege** - Only grant necessary Device Farm permissions
4. **Rotate credentials regularly** - Update AWS keys periodically
5. **Use separate credentials for CI/CD** - Don't reuse personal AWS credentials




