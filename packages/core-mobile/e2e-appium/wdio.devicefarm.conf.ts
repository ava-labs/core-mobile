import {
  addCaseToRun,
  getSection,
  getTestCase,
  getTestRun,
  sendResult,
  uploadScreenshotToResult
} from './testrail/testrail.service'
import {
  inferRunPlatforms,
  resolveDeviceCaps,
  unusedPlatformCaps
} from './helpers/resolve-local-device'

let runId: number | undefined
const sectionCache: Record<string, number> = {}

// AWS Device Farm provides these environment variables
const isDeviceFarm = !!process.env.AWS_DEVICE_FARM_APPIUM_SERVER_URL
/** Packaged runs set AWS_DEVICE_FARM_APPIUM_SERVER_URL; keep Appium off. Local use of this file can start Appium like wdio.conf. */
const useWdioAppiumService =
  !isDeviceFarm && process.env.APPIUM_MANUAL !== 'true'
const appiumServerUrl =
  process.env.AWS_DEVICE_FARM_APPIUM_SERVER_URL || 'http://localhost:4723'
const rawAppPath =
  process.env.AWS_DEVICE_FARM_APP_PATH || process.env.APP_PATH || ''
if (!rawAppPath) {
  const expectedEnvVar = isDeviceFarm ? 'AWS_DEVICE_FARM_APP_PATH' : 'APP_PATH'
  throw new Error(
    `Mobile app path not configured. Set the ${expectedEnvVar} environment variable ` +
      '(use APP_PATH for local runs and AWS_DEVICE_FARM_APP_PATH on AWS Device Farm).'
  )
}
const appPath = rawAppPath
const platformToRun =
  process.env.PLATFORM || process.env.DEVICEFARM_DEVICE_PLATFORM_NAME

const chromedriverExecutableDir =
  process.env.DEVICEFARM_CHROMEDRIVER_EXECUTABLE_DIR || ''

const { runAndroid, runIos } = inferRunPlatforms(platformToRun, isDeviceFarm)
const androidResolved = runAndroid
  ? resolveDeviceCaps('Android', isDeviceFarm)
  : unusedPlatformCaps()
const iosResolved = runIos
  ? resolveDeviceCaps('iOS', isDeviceFarm)
  : unusedPlatformCaps()

const allCaps = [
  {
    platformName: 'Android',
    'appium:deviceName': androidResolved.deviceName,
    'appium:platformVersion': androidResolved.platformVersion,
    'appium:automationName': 'UiAutomator2',
    'appium:app': appPath,
    ...(androidResolved.deviceUdid
      ? { 'appium:udid': androidResolved.deviceUdid }
      : {}),
    ...(chromedriverExecutableDir
      ? { 'appium:chromedriverExecutableDir': chromedriverExecutableDir }
      : {}),
    'appium:appWaitActivity': '*',
    'appium:autoGrantPermissions': true,
    'appium:newCommandTimeout': 120,
    'appium:adbExecTimeout': 60000,
    'appium:uiautomator2ServerLaunchTimeout': 60000,
    'appium:uiautomator2ServerInstallTimeout': 60000,
    'appium:noSign': true,
    'appium:disableWindowAnimation': true,
    'appium:fullReset': true,
    'appium:enforceAppInstall': true,
    'appium:uiautomator2ServerReadTimeout': 60000,
    'appium:skipDeviceInitialization': false,
    'appium:skipLogcatCapture': false
  },
  {
    platformName: 'iOS',
    'appium:deviceName': iosResolved.deviceName,
    'appium:waitForIdleTimeout': 0,
    'appium:maxTypingFrequency': 30,
    'appium:platformVersion': iosResolved.platformVersion,
    'appium:automationName': 'xcuitest',
    'appium:app': appPath,
    ...(iosResolved.deviceUdid
      ? { 'appium:udid': iosResolved.deviceUdid }
      : {}),
    'appium:autoAcceptAlerts': true,
    'appium:autoDismissAlerts': true,
    'appium:wdaStartupRetries': 5,
    'appium:wdaStartupRetryInterval': 30000,
    'appium:wdaLaunchTimeout': 360000,
    'appium:wdaConnectionTimeout': 360000,
    ...(process.env.WDA_DERIVED_DATA_PATH
      ? {
          'appium:usePrebuiltWDA': true,
          'appium:derivedDataPath': process.env.WDA_DERIVED_DATA_PATH
        }
      : { 'appium:usePrebuiltWDA': false }),
    ...(process.env.XCODE_CONFIG_FILE
      ? {
          'appium:xcodeConfigFile': process.env.XCODE_CONFIG_FILE,
          'appium:xcodeOrgId': process.env.XCODE_ORG_ID,
          'appium:allowProvisioningUpdates': true
        }
      : process.env.XCODE_ORG_ID
      ? {
          'appium:xcodeOrgId': process.env.XCODE_ORG_ID,
          'appium:xcodeSigningId': 'iPhone Developer',
          'appium:allowProvisioningUpdates': true
        }
      : {}),
    'appium:shouldUseSingletonTestManager': false,
    'appium:showXcodeLog': true,
    'appium:settings[snapshotMaxDepth]': 70,
    'appium:isHeadless': false
  }
]

const caps = platformToRun
  ? allCaps.filter(
      cap => cap.platformName.toLowerCase() === platformToRun.toLowerCase()
    )
  : allCaps.filter(
      cap =>
        (runAndroid && cap.platformName === 'Android') ||
        (runIos && cap.platformName === 'iOS')
    )

/** When `IS_PERFORMANCE` / `TEST_TYPE=performance`, only run specs under `specs/performance/`. */
function getSpecs(): string[] {
  if (process.env.SPEC_FILE) {
    return [`./${process.env.SPEC_FILE}`]
  }
  if (
    process.env.TEST_TYPE === 'performance' ||
    process.env.IS_PERFORMANCE === 'true'
  ) {
    return ['./specs/performance/**/*.ts']
  }
  return ['./specs/**/*.ts']
}

export const config: WebdriverIO.Config = {
  runner: 'local',
  tsConfigPath: './tsconfig.json',
  specs: getSpecs(),
  exclude: [],
  maxInstances: 1,
  // AWS Device Farm manages Appium, so we connect to their server
  // For Device Farm, we use the full URL directly
  ...(isDeviceFarm
    ? {
        hostname: new URL(appiumServerUrl).hostname,
        port: parseInt(new URL(appiumServerUrl).port) || 4723,
        path: new URL(appiumServerUrl).pathname || '/',
        protocol:
          (new URL(appiumServerUrl).protocol.slice(0, -1) as
            | 'http'
            | 'https') || 'http'
      }
    : {
        hostname: 'localhost',
        port: 4723,
        path: '/',
        protocol: 'http' as const
      }),
  services: useWdioAppiumService
    ? [
        [
          'appium',
          {
            args: { relaxedSecurity: true },
            appiumStartTimeout: 120000
          }
        ]
      ]
    : [],
  logLevel: 'info', // More verbose for Device Farm debugging
  bail: 0,
  waitforTimeout: 20000,
  specFileRetries: 0,
  connectionRetryTimeout: 360000,
  connectionRetryCount: 2,
  framework: 'mocha',
  reporters: ['spec'],
  capabilities: caps,
  mochaOpts: {
    ui: 'bdd',
    timeout: 600000
  },

  // hook before: make or get testRun before test
  before: async () => {
    const platform = driver.isAndroid ? 'Android' : 'iOS'
    const testType = process.env.TEST_TYPE
    const isSmoke = testType === 'smoke' || process.env.IS_SMOKE === 'true'
    const isPerformance =
      testType === 'performance' || process.env.IS_PERFORMANCE === 'true'
    runId = await getTestRun(platform, isSmoke, isPerformance, isDeviceFarm)
    console.log(
      `------------Starting test run${
        isDeviceFarm ? ' on AWS Device Farm' : ''
      }------------`
    )
    console.log(`Platform: ${platform}`)
    const sessionCaps = driver.capabilities as Record<string, unknown>
    console.log(
      `Device: ${String(
        sessionCaps['appium:deviceName'] ?? sessionCaps.deviceName ?? ''
      )}`
    )
    console.log(
      `OS Version: ${String(
        sessionCaps['appium:platformVersion'] ??
          sessionCaps.platformVersion ??
          ''
      )}`
    )
    const udid = sessionCaps['appium:udid'] ?? sessionCaps.udid
    if (udid) {
      console.log(`Device UDID: ${String(udid)}`)
    }
    if (chromedriverExecutableDir) {
      console.log(`ChromeDriver Dir: ${chromedriverExecutableDir}`)
    }
  },

  // hook beforeTest: make or get testSection before test
  beforeTest: async test => {
    const sectionTitle = test.parent
    sectionCache[sectionTitle] = await getSection(sectionTitle)
    console.log('TEST: ', test.title)
  },

  after: async function () {
    console.log('------------Cleaning up session------------')
    await new Promise(res => setTimeout(res, 500))
  },

  // hook afterTest: make or get testCase and send result after test
  afterTest: async (test, _, { passed, error }) => {
    const sectionTitle = test.parent
    const sectionId = sectionCache[sectionTitle]
    const caseId = await getTestCase(test.title, sectionId)
    const statusId = passed ? 1 : 5

    // Capture page source on test failure for debugging
    if (!passed) {
      try {
        const fs = require('fs')
        const path = require('path')
        const pageSource = await driver.getPageSource()
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const sanitizedTestName = test.title
          .replace(/[^a-zA-Z0-9]/g, '_')
          .substring(0, 50)
        const outputDir = path.join(__dirname, 'page-source-failures')
        if (!fs.existsSync(outputDir))
          fs.mkdirSync(outputDir, { recursive: true })
        const pageSourcePath = path.join(
          outputDir,
          `page-source-failure-${sanitizedTestName}-${timestamp}.xml`
        )
        fs.writeFileSync(pageSourcePath, pageSource)
        console.log(`\n📄 Page source saved on test failure: ${pageSourcePath}`)
      } catch (e: unknown) {
        const saveError = e instanceof Error ? e.message : String(e)
        console.error('Failed to save page source on test failure:', saveError)
      }
    }

    if (runId) {
      await addCaseToRun(runId, caseId)
      const resultId = await sendResult(runId, caseId, statusId, error)

      if (!passed && resultId) {
        const screenshotBase64 = await driver.takeScreenshot()
        await uploadScreenshotToResult(resultId, screenshotBase64)
      }
    } else {
      console.error('testRun not found')
    }
  }
}
