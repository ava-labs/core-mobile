#!/usr/bin/env node

/**
 * AWS Device Farm Test Runner using AWS SDK
 *
 * This script triggers a test run on AWS Device Farm using the AWS SDK for JavaScript.
 *
 * Credentials (pick one):
 *   - Bitrise/CI: Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in env (e.g. Bitrise Secrets).
 *   - Local: Run `aws configure --profile bitrise-devicefarm` then set AWS_PROFILE=bitrise-devicefarm,
 *     or export AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.
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
 *   PLATFORM=android   (case-insensitive: Android / IOS from CI are accepted)
 *   WAIT_FOR_COMPLETION=true   (optional; poll until run completes — needs devicefarm:GetRun; also accepts yes/1)
 *   WAIT_FOR_COMPLETION_TIMEOUT_SEC=7200   (optional; default 2 hours when waiting)
 *
 * Why ARNs? The Device Farm API requires a project ARN (where to upload app/tests) and
 * a device pool ARN (which devices to run on). These are not the IAM user ARN.
 *
 * Required IAM actions for the trigger user (e.g. bitrise-devicefarm-sa):
 *   devicefarm:GetProject, devicefarm:CreateUpload, devicefarm:GetUpload,
 *   devicefarm:ScheduleRun (and optionally devicefarm:GetRun if waiting for completion).
 * See scripts/devicefarm/README.md for an example IAM policy.
 */

const fs = require('fs')
const path = require('path')
const { Buffer } = require('node:buffer')
const https = require('https')
const http = require('http')
const {
  DeviceFarmClient,
  CreateUploadCommand,
  GetUploadCommand,
  GetProjectCommand,
  GetDevicePoolCommand,
  ListDevicePoolDevicesCommand,
  GetRunCommand,
  ScheduleRunCommand
} = require('@aws-sdk/client-device-farm')

/** Case-insensitive truthy env (1, true, yes). */
function parseBoolEnv(name) {
  const v = process.env[name]
  if (v === undefined || v === '') return false
  return /^(1|true|yes)$/i.test(String(v).trim())
}

function coerceBool(value) {
  if (typeof value === 'boolean') return value
  if (value === undefined || value === '') return false
  return /^(1|true|yes)$/i.test(String(value).trim())
}

// Parse command line arguments
const args = process.argv.slice(2)
const config = {
  projectArn: process.env.DEVICEFARM_PROJECT_ARN,
  devicePoolArn: process.env.DEVICEFARM_DEVICE_POOL_ARN,
  appPath: process.env.DEVICEFARM_APP_PATH,
  testPackagePath:
    process.env.DEVICEFARM_TEST_PACKAGE_PATH ||
    process.env.DEVICEFARM_TEST_PACKAGE,
  testSpecPath: process.env.DEVICEFARM_TEST_SPEC_PATH,
  platform: process.env.PLATFORM || 'android',
  region:
    process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2',
  waitForCompletion: parseBoolEnv('WAIT_FOR_COMPLETION')
}

// Parse CLI arguments (--flag value). Map kebab-case flags to config keys (not raw dash-stripping).
const cliFlagToConfigKey = {
  'project-arn': 'projectArn',
  'device-pool-arn': 'devicePoolArn',
  'app-path': 'appPath',
  'test-package-path': 'testPackagePath',
  'test-spec-path': 'testSpecPath',
  platform: 'platform',
  region: 'region',
  'wait-for-completion': 'waitForCompletion'
}
for (let i = 0; i < args.length; i += 2) {
  const flag = args[i]?.replace(/^--/, '')
  const value = args[i + 1]
  if (!flag || value === undefined) continue
  const configKey = cliFlagToConfigKey[flag]
  if (configKey) {
    config[configKey] = value
  }
}

// Normalize once: CI often sets PLATFORM=Android / iOS (e.g. Bitrise); all comparisons use lowercase.
config.platform = String(config.platform || 'android')
  .trim()
  .toLowerCase()
if (config.platform !== 'android' && config.platform !== 'ios') {
  console.error(
    `❌ PLATFORM must be android or ios (received: ${JSON.stringify(
      config.platform
    )})`
  )
  process.exit(1)
}
if (typeof config.waitForCompletion === 'string') {
  config.waitForCompletion = coerceBool(config.waitForCompletion)
}

// Validate required parameters (test spec drives Device Farm install/pre_test; do not schedule without it)
const required = [
  'projectArn',
  'devicePoolArn',
  'appPath',
  'testPackagePath',
  'testSpecPath'
]
const missing = required.filter(key => !config[key])
if (missing.length > 0) {
  console.error(`❌ Missing required parameters: ${missing.join(', ')}`)
  console.error('\nUsage:')
  console.error(
    '  node trigger-devicefarm-api.js --project-arn <arn> --device-pool-arn <arn> --app-path <path> --test-package-path <path> --test-spec-path <path>'
  )
  console.error('\nOr set environment variables:')
  console.error(
    '  DEVICEFARM_PROJECT_ARN, DEVICEFARM_DEVICE_POOL_ARN, DEVICEFARM_APP_PATH, DEVICEFARM_TEST_PACKAGE_PATH, DEVICEFARM_TEST_SPEC_PATH'
  )
  process.exit(1)
}

if (!fs.existsSync(config.testSpecPath)) {
  console.error(`❌ Test spec file not found: ${config.testSpecPath}`)
  console.error(
    '   Device Farm runs need aws_test_spec.yaml (install/pre_test). Set DEVICEFARM_TEST_SPEC_PATH or --test-spec-path.'
  )
  process.exit(1)
}

// Initialize AWS clients
const deviceFarmClient = new DeviceFarmClient({ region: config.region })

/**
 * Pre-flight: verify credentials and read access to the project.
 * Fails fast with a clear error if the IAM user cannot access the project.
 * Does not verify CreateUpload/ScheduleRun; those are required separately (see README).
 */
async function inspectDevicePool(devicePoolArn) {
  console.log('🔍 Inspecting device pool...')
  try {
    const poolRes = await deviceFarmClient.send(
      new GetDevicePoolCommand({ arn: devicePoolArn })
    )
    const pool = poolRes.devicePool
    console.log(`   Pool name: ${pool?.name}`)
    console.log(`   Pool type: ${pool?.type}`)
    console.log(`   Pool rules: ${JSON.stringify(pool?.rules, null, 2)}`)

    const devicesRes = await deviceFarmClient.send(
      new ListDevicePoolDevicesCommand({ arn: devicePoolArn })
    )
    const devices = devicesRes.devices || []
    console.log(`   Devices in pool (${devices.length}):`)
    devices.forEach(d => {
      console.log(
        `     - ${d.name} | ${d.platform} | OS: ${d.os} | Available: ${d.availability}`
      )
    })
    if (devices.length === 0) {
      console.log('   ⚠️  No devices found in pool!')
    }
  } catch (err) {
    console.warn(`   ⚠️  Could not inspect device pool: ${err.message}`)
  }
}

async function verifyProjectAccess(projectArn) {
  console.log('🔐 Verifying AWS credentials and project access...')
  try {
    const getProjectCommand = new GetProjectCommand({ arn: projectArn })
    const response = await deviceFarmClient.send(getProjectCommand)
    console.log(`   Project: ${response.project?.name || projectArn}`)
    console.log('✅ Credentials and project access OK\n')
  } catch (err) {
    if (
      err.name === 'InvalidSignatureException' ||
      err.message?.includes('security token')
    ) {
      console.error(
        '❌ Invalid AWS credentials. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY (or AWS_PROFILE).'
      )
    } else if (
      err.name === 'AccessDeniedException' ||
      err.name === 'NotFoundException'
    ) {
      console.error(
        `❌ No access to project or project not found: ${err.message}`
      )
      console.error(
        '   Ensure the IAM user has devicefarm:GetProject on this project.'
      )
    } else {
      console.error(`❌ Pre-flight failed: ${err.message}`)
    }
    throw err
  }
}

/**
 * Upload a file to Device Farm
 */
async function uploadFile(filePath, projectArn, uploadType, name) {
  console.log(`📤 Creating upload for ${name}...`)

  const createUploadCommand = new CreateUploadCommand({
    projectArn,
    name: name || path.basename(filePath),
    type: uploadType
  })

  const uploadResponse = await deviceFarmClient.send(createUploadCommand)
  const uploadArn = uploadResponse.upload.arn
  const uploadUrl = uploadResponse.upload.url

  console.log(`   Upload ARN: ${uploadArn}`)
  // Presigned URLs include credentials in the query string — do not log the full URL.
  try {
    const u = new URL(uploadUrl)
    console.log(
      `   Upload URL: ${u.origin}${u.pathname}${u.search ? '?…(redacted)' : ''}`
    )
  } catch {
    console.log('   Upload URL: (omitted)')
  }

  // Upload the file
  console.log(`📤 Uploading file: ${filePath}...`)
  await uploadToUrl(filePath, uploadUrl)

  // Wait for upload to complete
  console.log(`⏳ Waiting for upload to complete...`)
  await waitForUpload(uploadArn)

  return uploadArn
}

function makeUploadFailedError(statusCode, chunks) {
  const body = Buffer.concat(chunks).toString('utf8').trim()
  const detail = body ? body.slice(0, 500) : ''
  const msg =
    'Upload failed with status ' +
    String(statusCode) +
    (detail ? ': ' + detail : '')
  return new Error(msg)
}

function attachUploadSuccessHandlers(res, finish, resolve, reject) {
  res.resume()
  res.on('end', () => finish(() => resolve()))
  res.on('error', err => finish(() => reject(err)))
}

function attachUploadFailureHandlers(res, finish, reject) {
  const chunks = []
  res.on('data', chunk => {
    chunks.push(chunk)
  })
  res.on('end', () => {
    finish(() => reject(makeUploadFailedError(res.statusCode, chunks)))
  })
  res.on('error', err => {
    finish(() => reject(err))
  })
}

/**
 * Upload file to a presigned URL (S3 / Device Farm upload URL).
 * Drains non-2xx response bodies so the socket can close cleanly; aborts the request if the read stream fails.
 */
function uploadToUrl(filePath, url) {
  return new Promise((resolve, reject) => {
    let settled = false
    const finish = fn => {
      if (settled) return
      settled = true
      fn()
    }

    let fileSize
    try {
      fileSize = fs.statSync(filePath).size
    } catch (e) {
      reject(e)
      return
    }

    const fileStream = fs.createReadStream(filePath)

    const parsedUrl = new URL(url)
    const client = parsedUrl.protocol === 'https:' ? https : http

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'PUT',
      headers: {
        'Content-Length': fileSize
      }
    }

    const req = client.request(options, res => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        attachUploadSuccessHandlers(res, finish, resolve, reject)
        return
      }
      attachUploadFailureHandlers(res, finish, reject)
    })

    req.on('error', err => finish(() => reject(err)))
    fileStream.on('error', err => {
      req.destroy(err)
      finish(() => reject(err))
    })
    fileStream.pipe(req)
  })
}

/**
 * Wait for an upload to complete
 */
async function waitForUpload(uploadArn) {
  const maxWaitTime = 300 // 5 minutes
  const startTime = Date.now()

  while (true) {
    const getUploadCommand = new GetUploadCommand({ arn: uploadArn })
    const response = await deviceFarmClient.send(getUploadCommand)
    const status = response.upload.status

    console.log(`   Upload status: ${status}`)

    if (status === 'SUCCEEDED') {
      console.log('✅ Upload completed successfully')
      return
    } else if (status === 'FAILED') {
      throw new Error(
        `Upload failed: ${response.upload.message || 'Unknown error'}`
      )
    }

    if (Date.now() - startTime > maxWaitTime * 1000) {
      throw new Error('Upload timeout')
    }

    await sleep(5000) // Wait 5 seconds
  }
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** Outcomes that exit 0 after status COMPLETED */
const SUCCESS_RESULTS = new Set(['PASSED', 'WARNED', 'SKIPPED'])

function parseWaitForCompletionTimeoutSec() {
  const rawTimeout = process.env.WAIT_FOR_COMPLETION_TIMEOUT_SEC
  const parsed = parseInt(
    rawTimeout !== undefined && rawTimeout !== '' ? rawTimeout : '7200',
    10
  )
  return Number.isFinite(parsed) ? Math.max(60, parsed) : 7200
}

function handleCompletedDeviceFarmRun(run) {
  const result = run?.result
  if (result && SUCCESS_RESULTS.has(result)) {
    console.log(`✅ Run finished successfully (${result})`)
    return
  }
  const detail = run?.message ? ': ' + run.message : ''
  throw new Error(`Run completed with result ${result ?? 'UNKNOWN'}${detail}`)
}

/**
 * Poll GetRun until the run reaches a terminal state (status COMPLETED) or timeout.
 * Uses exponential backoff between polls (5s → capped at 60s).
 */
async function waitForRunCompletion(runArn) {
  const timeoutSec = parseWaitForCompletionTimeoutSec()
  const deadline = Date.now() + timeoutSec * 1000
  let delayMs = 5000
  const maxDelayMs = 60000

  while (Date.now() < deadline) {
    const response = await deviceFarmClient.send(
      new GetRunCommand({ arn: runArn })
    )
    const run = response.run
    const status = run?.status
    const result = run?.result

    console.log(
      `   Run status: ${status ?? '(unknown)'}, result: ${
        result ?? '(pending)'
      }`
    )

    if (status === 'COMPLETED') {
      handleCompletedDeviceFarmRun(run)
      return
    }

    await sleep(Math.min(delayMs, maxDelayMs))
    delayMs = Math.min(maxDelayMs, Math.floor(delayMs * 1.5))
  }

  throw new Error(
    `Timed out waiting for run after ${timeoutSec}s (set WAIT_FOR_COMPLETION_TIMEOUT_SEC to adjust)`
  )
}

/**
 * Write env vars into a .df_env file and add it to the test package zip.
 * The yaml sources this file silently — values never appear in Device Farm logs.
 */
function injectEnvVarsIntoTestPackage(testPackagePath, envVars) {
  if (Object.keys(envVars).length === 0) return

  const { execFileSync } = require('child_process')
  const envContent = Object.entries(envVars)
    .map(([k, v]) => `export ${k}="${v}"`)
    .join('\n')

  const tmpEnvPath = path.join(path.dirname(testPackagePath), '.df_env')
  fs.writeFileSync(tmpEnvPath, envContent)

  try {
    execFileSync('zip', ['-j', testPackagePath, tmpEnvPath])
    console.log(
      `✅ Env vars bundled into test package: ${Object.keys(envVars).join(
        ', '
      )}`
    )
  } finally {
    fs.unlinkSync(tmpEnvPath)
  }
}

/**
 * Main function to trigger test run
 */
async function main() {
  try {
    console.log('🚀 Starting AWS Device Farm test run via API...')
    console.log('')
    console.log('📋 Parameters being sent to AWS:')
    console.log(`   projectArn:      ${config.projectArn}`)
    console.log(`   devicePoolArn:  ${config.devicePoolArn}`)
    console.log(`   region:         ${config.region}`)
    console.log(`   platform:       ${config.platform}`)
    console.log(`   appPath:        ${config.appPath}`)
    console.log(`   testPackagePath: ${config.testPackagePath}`)
    console.log(`   testSpecPath:   ${config.testSpecPath}`)
    console.log('')

    await verifyProjectAccess(config.projectArn)
    await inspectDevicePool(config.devicePoolArn)

    for (const [label, p] of [
      ['app', config.appPath],
      ['test package', config.testPackagePath]
    ]) {
      if (!fs.existsSync(p)) {
        throw new Error(`${label} path does not exist or is not readable: ${p}`)
      }
    }

    // Determine upload types
    const appType = config.platform === 'android' ? 'ANDROID_APP' : 'IOS_APP'
    const testSpecType = 'APPIUM_NODE_TEST_SPEC'

    // 1. Upload app
    const appUploadArn = await uploadFile(
      config.appPath,
      config.projectArn,
      appType,
      path.basename(config.appPath)
    )

    // 2. Bundle env vars into test package zip BEFORE uploading (values hidden from Device Farm logs).
    // Picks up any env var whose prefix matches the allowlist — add new vars to load-e2e-env.sh only.
    const E2E_ENV_PREFIXES = [
      'E2E_',
      'TEST_OIDC_',
      'IS_SEEDLESS',
      'TESTRAIL_',
      'SPEC_FILE',
      'E2E'
    ]
    const envVars = Object.fromEntries(
      Object.entries(process.env).filter(
        ([k, v]) =>
          v &&
          E2E_ENV_PREFIXES.some(prefix => k === prefix || k.startsWith(prefix))
      )
    )

    // 2. Bundle env vars into test package zip BEFORE uploading (values hidden from Device Farm logs)
    const envVars = {}
    if (process.env.SPEC_FILE) envVars.SPEC_FILE = process.env.SPEC_FILE
    if (process.env.E2E) envVars.E2E = process.env.E2E
    if (process.env.E2E_MNEMONIC)
      envVars.E2E_MNEMONIC = process.env.E2E_MNEMONIC
    if (process.env.E2E_PK) envVars.E2E_PK = process.env.E2E_PK
    if (process.env.E2E_METAMASK_MNEMONIC)
      envVars.E2E_METAMASK_MNEMONIC = process.env.E2E_METAMASK_MNEMONIC
    if (process.env.TESTRAIL_API_KEY)
      envVars.TESTRAIL_API_KEY = process.env.TESTRAIL_API_KEY
    if (process.env.TESTRAIL_USERNAME)
      envVars.TESTRAIL_USERNAME = process.env.TESTRAIL_USERNAME

    injectEnvVarsIntoTestPackage(config.testPackagePath, envVars)

    // 3. Upload test package (now includes .df_env with env vars)
    const testPackageUploadArn = await uploadFile(
      config.testPackagePath,
      config.projectArn,
      'APPIUM_NODE_TEST_PACKAGE',
      'appium-tests.zip'
    )

    // 4. Upload test spec
    const testSpecUploadArn = await uploadFile(
      config.testSpecPath,
      config.projectArn,
      testSpecType,
      'aws_test_spec.yaml'
    )

    // 4. Schedule test run
    console.log('📅 Scheduling test run...')
    const runName = `Appium Test Run - ${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')}`

    const testConfig = {
      type: 'APPIUM_NODE',
      testPackageArn: testPackageUploadArn,
      testSpecArn: testSpecUploadArn
    }

    const scheduleRunCommand = new ScheduleRunCommand({
      projectArn: config.projectArn,
      appArn: appUploadArn,
      devicePoolArn: config.devicePoolArn,
      name: runName,
      test: testConfig
    })

    const runResponse = await deviceFarmClient.send(scheduleRunCommand)
    const runArn = runResponse.run.arn
    // Fragment path segments must be percent-encoded: ARNs contain ':' and other reserved characters.
    const runUrl = `https://console.aws.amazon.com/devicefarm/home?region=${encodeURIComponent(
      config.region
    )}#/projects/${encodeURIComponent(
      config.projectArn
    )}/runs/${encodeURIComponent(runArn)}`

    console.log('✅ Test run scheduled successfully!')
    console.log(`   Run ARN: ${runArn}`)
    console.log(`   View run at: ${runUrl}`)

    if (config.waitForCompletion) {
      console.log('⏳ Waiting for test run to complete (GetRun polling)...')
      await waitForRunCompletion(runArn)
    } else {
      console.log(
        'ℹ️  Exiting after schedule (set WAIT_FOR_COMPLETION=true to poll until the run finishes).'
      )
    }

    // Expose for Bitrise follow-up steps (Slack, etc.) via envman
    try {
      const { execFileSync } = require('child_process')
      execFileSync(
        'envman',
        ['add', '--key', 'DEVICEFARM_RUN_ARN', '--value', runArn],
        { stdio: 'ignore' }
      )
      execFileSync(
        'envman',
        ['add', '--key', 'DEVICEFARM_RUN_URL', '--value', runUrl],
        { stdio: 'ignore' }
      )
    } catch {
      // envman not on PATH (e.g. local runs) — ignore
    }

    // Return run ARN for use in scripts
    console.log(`\nRun ARN: ${runArn}`)
    return runArn
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('❌ Unhandled error:', err)
    process.exit(1)
  })
}

module.exports = {
  main,
  uploadFile,
  uploadToUrl,
  waitForUpload,
  waitForRunCompletion
}
