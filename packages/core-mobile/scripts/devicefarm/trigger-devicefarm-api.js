#!/usr/bin/env node
/* eslint-disable */

/**
 * AWS Device Farm Test Runner using AWS SDK
 * 
 * This script triggers a test run on AWS Device Farm using the AWS SDK for JavaScript.
 * 
 * Usage:
 *   node trigger-devicefarm-api.js \
 *     --project-arn "arn:aws:devicefarm:..." \
 *     --device-pool-arn "arn:aws:devicefarm:..." \
 *     --app-path "/path/to/app.apk" \
 *     --test-package-path "/path/to/tests.zip" \
 *     --test-spec-path "/path/to/aws_test_spec.yaml" \
 *     --platform "android"
 * 
 * Or set environment variables:
 *   DEVICEFARM_PROJECT_ARN=...
 *   DEVICEFARM_DEVICE_POOL_ARN=...
 *   DEVICEFARM_APP_PATH=...
 *   DEVICEFARM_TEST_PACKAGE_PATH=...
 *   DEVICEFARM_TEST_SPEC_PATH=...
 *   PLATFORM=android
 */

const { DeviceFarmClient, CreateUploadCommand, GetUploadCommand, ScheduleRunCommand } = require('@aws-sdk/client-device-farm');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Parse command line arguments
const args = process.argv.slice(2);
const config = {
  projectArn: process.env.DEVICEFARM_PROJECT_ARN,
  devicePoolArn: process.env.DEVICEFARM_DEVICE_POOL_ARN,
  appPath: process.env.DEVICEFARM_APP_PATH,
  testPackagePath: process.env.DEVICEFARM_TEST_PACKAGE_PATH || process.env.DEVICEFARM_TEST_PACKAGE,
  testSpecPath: process.env.DEVICEFARM_TEST_SPEC_PATH,
  platform: process.env.PLATFORM || 'android',
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2',
  waitForCompletion: process.env.WAIT_FOR_COMPLETION === 'true',
};

// Parse CLI arguments
for (let i = 0; i < args.length; i += 2) {
  const key = args[i]?.replace('--', '');
  const value = args[i + 1];
  if (key && value) {
    config[key.replace(/-/g, '')] = value;
  }
}

// Validate required parameters
const required = ['projectArn', 'devicePoolArn', 'appPath', 'testPackagePath'];
const missing = required.filter(key => !config[key]);
if (missing.length > 0) {
  console.error(`❌ Missing required parameters: ${missing.join(', ')}`);
  console.error('\nUsage:');
  console.error('  node trigger-devicefarm-api.js --project-arn <arn> --device-pool-arn <arn> --app-path <path> --test-package-path <path>');
  console.error('\nOr set environment variables:');
  console.error('  DEVICEFARM_PROJECT_ARN, DEVICEFARM_DEVICE_POOL_ARN, DEVICEFARM_APP_PATH, DEVICEFARM_TEST_PACKAGE_PATH');
  process.exit(1);
}

// Initialize AWS clients
const deviceFarmClient = new DeviceFarmClient({ region: config.region });

/**
 * Upload a file to Device Farm
 */
async function uploadFile(filePath, projectArn, uploadType, name) {
  console.log(`📤 Creating upload for ${name}...`);
  
  const createUploadCommand = new CreateUploadCommand({
    projectArn,
    name: name || path.basename(filePath),
    type: uploadType,
  });

  const uploadResponse = await deviceFarmClient.send(createUploadCommand);
  const uploadArn = uploadResponse.upload.arn;
  const uploadUrl = uploadResponse.upload.url;

  console.log(`   Upload ARN: ${uploadArn}`);
  console.log(`   Upload URL: ${uploadUrl}`);

  // Upload the file
  console.log(`📤 Uploading file: ${filePath}...`);
  await uploadToUrl(filePath, uploadUrl);

  // Wait for upload to complete
  console.log(`⏳ Waiting for upload to complete...`);
  await waitForUpload(uploadArn);

  return uploadArn;
}

/**
 * Upload file to a presigned URL
 */
function uploadToUrl(filePath, url) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath);
    const fileSize = fs.statSync(filePath).size;

    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'PUT',
      headers: {
        'Content-Length': fileSize,
      },
    };

    const req = client.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${res.statusCode}`));
      }
    });

    req.on('error', reject);
    fileStream.pipe(req);
  });
}

/**
 * Wait for an upload to complete
 */
async function waitForUpload(uploadArn) {
  const maxWaitTime = 300; // 5 minutes
  const startTime = Date.now();

  while (true) {
    const getUploadCommand = new GetUploadCommand({ arn: uploadArn });
    const response = await deviceFarmClient.send(getUploadCommand);
    const status = response.upload.status;

    console.log(`   Upload status: ${status}`);

    if (status === 'SUCCEEDED') {
      console.log('✅ Upload completed successfully');
      return;
    } else if (status === 'FAILED') {
      throw new Error(`Upload failed: ${response.upload.message || 'Unknown error'}`);
    }

    if (Date.now() - startTime > maxWaitTime * 1000) {
      throw new Error('Upload timeout');
    }

    await sleep(5000); // Wait 5 seconds
  }
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function to trigger test run
 */
async function main() {
  try {
    console.log('🚀 Starting AWS Device Farm test run via API...');
    console.log(`   Project ARN: ${config.projectArn}`);
    console.log(`   Device Pool ARN: ${config.devicePoolArn}`);
    console.log(`   Platform: ${config.platform}`);
    console.log(`   App: ${config.appPath}`);
    console.log(`   Test Package: ${config.testPackagePath}`);

    // Determine upload types
    const appType = config.platform === 'android' ? 'ANDROID_APP' : 'IOS_APP';
    const testSpecType = config.platform === 'android' ? 'APPIUM_NODE_TEST_SPEC' : 'APPIUM_NODE_TEST_SPEC';

    // 1. Upload app
    const appUploadArn = await uploadFile(
      config.appPath,
      config.projectArn,
      appType,
      path.basename(config.appPath)
    );

    // 2. Upload test package
    const testPackageUploadArn = await uploadFile(
      config.testPackagePath,
      config.projectArn,
      'APPIUM_NODE_TEST_PACKAGE',
      'appium-tests.zip'
    );

    // 3. Upload test spec (if provided)
    let testSpecUploadArn = null;
    if (config.testSpecPath && fs.existsSync(config.testSpecPath)) {
      testSpecUploadArn = await uploadFile(
        config.testSpecPath,
        config.projectArn,
        testSpecType,
        'aws_test_spec.yaml'
      );
    }

    // 4. Schedule test run
    console.log('📅 Scheduling test run...');
    const runName = `Appium Test Run - ${new Date().toISOString().replace(/[:.]/g, '-')}`;

    const testConfig = {
      type: 'APPIUM_NODE',
      testPackageArn: testPackageUploadArn,
    };

    if (testSpecUploadArn) {
      testConfig.testSpecArn = testSpecUploadArn;
    }

    const scheduleRunCommand = new ScheduleRunCommand({
      projectArn: config.projectArn,
      appArn: appUploadArn,
      devicePoolArn: config.devicePoolArn,
      name: runName,
      test: testConfig,
    });

    const runResponse = await deviceFarmClient.send(scheduleRunCommand);
    const runArn = runResponse.run.arn;
    const runUrl = `https://console.aws.amazon.com/devicefarm/home?region=${config.region}#/projects/${config.projectArn}/runs/${runArn}`;

    console.log('✅ Test run scheduled successfully!');
    console.log(`   Run ARN: ${runArn}`);
    console.log(`   View run at: ${runUrl}`);

    // Optionally wait for completion
    if (config.waitForCompletion) {
      console.log('⏳ Waiting for test run to complete...');
      // You can implement wait logic here using GetRunCommand
      // This is left as an exercise or can be added if needed
    }

    // Return run ARN for use in scripts
    console.log(`\nRun ARN: ${runArn}`);
    return runArn;

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, uploadFile, waitForUpload };

