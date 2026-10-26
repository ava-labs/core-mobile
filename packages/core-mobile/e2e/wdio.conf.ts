import fs from 'node:fs'
import path from 'node:path'

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

const platformToRun =
  process.env.PLATFORM || process.env.DEVICEFARM_DEVICE_PLATFORM_NAME

// AWS Device Farm provides these environment variables
const isDeviceFarm = !!process.env.AWS_DEVICE_FARM_APPIUM_SERVER_URL
/** Start Appium via WDIO unless Device Farm (host runs Appium) or APPIUM_MANUAL=true (you started Appium yourself). */
const useWdioAppiumService =
  !isDeviceFarm && process.env.APPIUM_MANUAL !== 'true'
/** TestRail reporting is opt-in: CI supplies TESTRAIL_API_KEY; local runs set TESTRAIL_DISABLED=true (or have no key). */
const testRailEnabled =
  process.env.TESTRAIL_DISABLED !== 'true' && !!process.env.TESTRAIL_API_KEY
/** Local Appium port; override with APPIUM_PORT to run iOS and Android sessions side by side. */
const localAppiumPort = parseInt(process.env.APPIUM_PORT ?? '', 10) || 4723
const appiumServerUrl =
  process.env.AWS_DEVICE_FARM_APPIUM_SERVER_URL ||
  `http://localhost:${localAppiumPort}`
const rawAppPath =
  process.env.AWS_DEVICE_FARM_APP_PATH || process.env.APP_PATH || ''
if (!rawAppPath && isDeviceFarm) {
  throw new Error(
    'Mobile app path not configured. Set the AWS_DEVICE_FARM_APP_PATH environment variable on AWS Device Farm.'
  )
}

// E2E_LOCAL_PATH points at a downloaded e2e build (.app/.apk); page objects also
// treat its presence as "release build" and skip the Metro dev-menu dismissal
const localBuildPath = process.env.E2E_LOCAL_PATH || ''
const iosLocalPath =
  localBuildPath || './ios/build/Debug-iphonesimulator/AvaxWalletInternal.app'
const androidLocalPath =
  localBuildPath ||
  './android/app/build/outputs/apk/internal/debug/app-internal-debug.apk'

const iosAppPath = rawAppPath || path.resolve(iosLocalPath)
const androidAppPath = rawAppPath || path.resolve(androidLocalPath)

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
    'appium:appActivity': 'com.avaxwallet.MainActivityDefault',
    'appium:appWaitActivity': '*',
    'appium:app': androidAppPath,
    ...(androidResolved.deviceUdid
      ? { 'appium:udid': androidResolved.deviceUdid }
      : {}),
    ...(chromedriverExecutableDir
      ? { 'appium:chromedriverExecutableDir': chromedriverExecutableDir }
      : {}),
    'appium:appWaitDuration': 20000,
    'appium:autoGrantPermissions': true,
    'appium:newCommandTimeout': 120,
    'appium:adbExecTimeout': 20000,
    'appium:uiautomator2ServerLaunchTimeout': 20000,
    'appium:uiautomator2ServerInstallTimeout': 20000,
    'appium:noSign': true,
    'appium:disableWindowAnimation': true,
    'appium:fullReset': true,
    'appium:enforceAppInstall': true,
    'appium:uiautomator2ServerReadTimeout': 20000,
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
    'appium:app': iosAppPath,
    ...(iosResolved.deviceUdid
      ? { 'appium:udid': iosResolved.deviceUdid }
      : {}),
    'appium:autoAcceptAlerts': true,
    'appium:autoDismissAlerts': true,
    'appium:wdaStartupRetries': 5,
    'appium:wdaStartupRetryInterval': 30000,
    'appium:wdaLaunchTimeout': 360000,
    'appium:wdaConnectionTimeout': 360000,
    'appium:usePrebuiltWDA': false,
    ...(process.env.XCODE_ORG_ID
      ? {
          'appium:xcodeOrgId': process.env.XCODE_ORG_ID,
          'appium:xcodeSigningId': 'iPhone Developer',
          'appium:allowProvisioningUpdates': true
        }
      : {}),
    'appium:shouldUseSingletonTestManager': false,
    'appium:showXcodeLog': true,
    'appium:settings[snapshotMaxDepth]': 62,
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

function getSpecs(): string[] {
  if (process.env.IS_SEEDLESS_TRANSACTIONS === 'true') {
    return ['./specs/transactions/**/*.ts']
  }
  if (
    process.env.TEST_TYPE === 'performance' ||
    process.env.IS_PERFORMANCE === 'true'
  ) {
    return ['./specs/performance/**/*.ts']
  }
  return ['./specs/**/*.ts']
}

/** Save a screenshot and page source for a failed test under e2e/artifacts/<platform>/ (gitignored). */
async function saveFailureArtifacts(title: string): Promise<void> {
  try {
    // Relative to packages/core-mobile, like the default app paths above
    const dir = path.resolve(
      './e2e/artifacts',
      driver.isAndroid ? 'android' : 'ios'
    )
    fs.mkdirSync(dir, { recursive: true })
    const base = path.join(
      dir,
      `${Date.now()}-${title.replace(/[^\w-]+/g, '_').slice(0, 80)}`
    )
    await driver.saveScreenshot(`${base}.png`)
    fs.writeFileSync(`${base}.xml`, await driver.getPageSource())
    console.log(`Failure artifacts: ${base}.{png,xml}`)
  } catch (e) {
    console.error('could not save failure artifacts', e)
  }
}

export const config: WebdriverIO.Config = {
  runner: 'local',
  tsConfigPath: './tsconfig.json',
  specs: getSpecs(),
  exclude: [
    // 'path/to/excluded/files'
    './specs/login.e2e.ts'
  ],
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
        port: localAppiumPort,
        path: '/',
        protocol: 'http' as const
      }),
  // Do not set `command: 'appium'`: that spawns the shell binary and can miss PATH on CI.
  // Omitting `command` makes @wdio/appium-service run `node` + the resolved local `appium` entry.
  services: useWdioAppiumService
    ? [
        [
          'appium',
          {
            args: { relaxedSecurity: true, port: localAppiumPort },
            appiumStartTimeout: 120000
          }
        ]
      ]
    : [],
  logLevel: 'error',
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
    timeout: 400000
  },

  // hook before: make or get testRun before test
  before: async () => {
    const platform = driver.isAndroid ? 'Android' : 'iOS'
    const testType = process.env.TEST_TYPE
    const isSmoke = testType === 'smoke' || process.env.IS_SMOKE === 'true'
    const isPerformance =
      testType === 'performance' || process.env.IS_PERFORMANCE === 'true'
    const isSeedlessTransactions =
      process.env.IS_SEEDLESS_TRANSACTIONS === 'true'
    if (testRailEnabled) {
      runId = await getTestRun(
        platform,
        isSmoke,
        isPerformance,
        isDeviceFarm,
        isSeedlessTransactions
      )
    } else {
      console.log(
        'TestRail reporting DISABLED (set TESTRAIL_API_KEY and unset TESTRAIL_DISABLED to enable)'
      )
    }
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
    console.log('TEST: ', test.title)
    if (!testRailEnabled) return
    const sectionTitle = test.parent
    const sectionId = await getSection(sectionTitle)
    if (sectionId !== undefined) sectionCache[sectionTitle] = sectionId
  },

  after: async function () {
    console.log('------------Cleaning up session------------')
    await new Promise(res => setTimeout(res, 500))
  },

  // hook afterTest: make or get testCase and send result after test
  afterTest: async (test, _, { passed, error }) => {
    // Capped so a dead session can't hang the hook on WDIO's connection retries
    if (!passed) {
      await Promise.race([
        saveFailureArtifacts(test.title),
        new Promise(resolve => setTimeout(resolve, 15000))
      ])
    }
    if (!testRailEnabled) return
    const sectionTitle = test.parent
    const sectionId = sectionCache[sectionTitle]
    const caseId = await getTestCase(test.title, sectionId)
    const statusId = passed ? 1 : 5

    if (!runId) {
      console.error('testRun not found')
      return
    }
    if (caseId === undefined) {
      console.error('testRail case not resolved; skipping result upload')
      return
    }

    await addCaseToRun(runId, caseId)
    const resultId = await sendResult(runId, caseId, statusId, error)

    if (!passed && resultId) {
      const screenshotBase64 = await driver.takeScreenshot()
      await uploadScreenshotToResult(resultId, screenshotBase64)
    }
  }
}
