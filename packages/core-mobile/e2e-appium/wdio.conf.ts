import path from 'path'
import fs from 'fs'
import {
  addCaseToRun,
  getSection,
  getTestCase,
  getTestRun,
  sendResult,
  uploadScreenshotToResult
} from './testrail/testrail.service'

let runId: number | undefined
const sectionCache: Record<string, number> = {}

// AWS Device Farm provides these environment variables
const isDeviceFarm = !!process.env.AWS_DEVICE_FARM_APPIUM_SERVER_URL
const appiumServerUrl =
  process.env.AWS_DEVICE_FARM_APPIUM_SERVER_URL || 'http://localhost:4723'
const appPath = process.env.AWS_DEVICE_FARM_APP_PATH || ''
const platformToRun =
  process.env.PLATFORM || process.env.DEVICEFARM_DEVICE_PLATFORM_NAME

// Device Farm provides device info via environment variables
const deviceName = process.env.DEVICEFARM_DEVICE_NAME || 'device'
const platformVersion = process.env.DEVICEFARM_DEVICE_OS_VERSION || '14.0'
const deviceUdid = process.env.DEVICEFARM_DEVICE_UDID || ''
const chromedriverExecutableDir =
  process.env.DEVICEFARM_CHROMEDRIVER_EXECUTABLE_DIR || ''
const isBitrise = process.env.CI === 'true'
// Resolve app paths from config dir (e2e-appium) so cwd doesn't matter
const projectRoot = path.join(__dirname, '..')
const defaultIosPath = path.join(
  projectRoot,
  'ios/Build/Products/Debug-iphonesimulator/AvaxWallet.app'
)
const projectDerivedDataPath = path.join(
  projectRoot,
  'ios/DerivedData/AvaxWallet/Index.noindex/Build/Products/Debug-iphonesimulator/AvaxWallet.app'
)
// Find app in Xcode's DerivedData (e.g. after `yarn ios`)
const xcodeDerivedDataAppPath = (() => {
  const base = path.join(
    process.env.HOME || '',
    'Library/Developer/Xcode/DerivedData'
  )
  if (!fs.existsSync(base)) return null
  const entries = fs.readdirSync(base, { withFileTypes: true })
  const avaxDir = entries.find(
    d => d.isDirectory() && d.name.startsWith('AvaxWallet-')
  )
  if (!avaxDir) return null
  const derivedAppPath = path.join(
    base,
    avaxDir.name,
    'Build/Products/Debug-iphonesimulator/AvaxWallet.app'
  )
  return fs.existsSync(derivedAppPath) ? derivedAppPath : null
})()
const iosLocalPath = process.env.E2E_LOCAL_PATH
  ? '/Users/eunji.song/Downloads/AvaxWalletInternal.app'
  : fs.existsSync(defaultIosPath)
  ? defaultIosPath
  : xcodeDerivedDataAppPath || projectDerivedDataPath
const androidLocalPath = process.env.E2E_LOCAL_PATH
  ? '/Users/eunji.song/Downloads/app-internal-e2e-bitrise-signed.apk'
  : './android/app/build/outputs/apk/internal/debug/app-internal-debug.apk'
const iosPath = isBitrise
  ? process.env.BITRISE_APP_DIR_PATH
  : path.isAbsolute(iosLocalPath)
  ? iosLocalPath
  : path.join(projectRoot, iosLocalPath)
// Use bundleId only to avoid EISDIR when client reads .app (directory) as file.
const useBundleIdOnly = process.env.E2E_USE_BUNDLE_ID === 'true' || !isBitrise
const androidPath = isBitrise
  ? process.env.BITRISE_APK_PATH
  : path.resolve(androidLocalPath)
const isSmoke = process.env.IS_SMOKE === 'true'
const isPerformance = process.env.IS_PERFORMANCE === 'true'

// Determine which specs to run based on test type (or CLI --spec override)
const getSpecs = (): string[] => {
  const specIdx = process.argv.indexOf('--spec')
  const specArg = specIdx >= 0 ? process.argv[specIdx + 1] : undefined
  if (specArg) {
    return [specArg]
  }
  if (isPerformance) {
    return ['./specs/performance/**/*.ts']
  }
  return ['./specs/**/*.ts']
}

function logPageSourceOnFailure(
  pageSource: string,
  opts: { maxLog?: number; outPath?: string } = {}
): void {
  const maxLog = opts.maxLog ?? 5000
  const outPath =
    opts.outPath ??
    path.join(projectRoot, 'e2e-appium/page-source-on-failure.xml')
  if (pageSource.length <= maxLog) {
    console.log('--- Page source on failure ---\n', pageSource)
  } else {
    console.log(
      '--- Page source on failure (first ',
      maxLog,
      ' chars) ---\n',
      pageSource.slice(0, maxLog)
    )
    fs.writeFileSync(outPath, pageSource, 'utf8')
    console.log('--- Full page source written to', outPath, '---')
  }
}

const allCaps = [
  {
    platformName: 'Android',
    'appium:deviceName': deviceName,
    'appium:platformVersion': platformVersion,
    'appium:automationName': 'UiAutomator2',
    'appium:app': isDeviceFarm ? appPath : androidPath,
    // Include Device Farm specific capabilities if available
    ...(deviceUdid ? { 'appium:udid': deviceUdid } : {}),
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
    'appium:deviceName': isDeviceFarm ? deviceName : 'iPhone 17 Pro',
    'appium:waitForIdleTimeout': 0,
    'appium:maxTypingFrequency': 30,
    'appium:platformVersion': isDeviceFarm ? platformVersion : '26.0',
    'appium:automationName': 'xcuitest',
    ...(isDeviceFarm
      ? { 'appium:app': appPath }
      : useBundleIdOnly
      ? { 'appium:bundleId': 'org.avalabs.corewallet' }
      : { 'appium:app': iosPath }),
    'appium:autoAcceptAlerts': true,
    'appium:autoDismissAlerts': true,
    'appium:wdaStartupRetries': 5,
    'appium:wdaStartupRetryInterval': 20000,
    'appium:usePrebuiltWDA': false,
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
  : allCaps

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
        port: 4723,
        path: '/',
        protocol: 'http' as const
      }),
  // No Appium service needed - Device Farm manages it
  services: [],
  logLevel: 'info', // More verbose for Device Farm debugging
  bail: 0,
  waitforTimeout: 20000,
  specFileRetries: 0,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 2,
  framework: 'mocha',
  reporters: ['spec'],
  capabilities: caps,
  mochaOpts: {
    ui: 'bdd',
    timeout: 600000
  },

  // hoook before: make or get testRun before test
  before: async () => {
    const platform = driver.isAndroid ? 'Android' : 'iOS'
    const smoke = isSmoke || process.env.TEST_TYPE === 'smoke'
    const perf = isPerformance || process.env.TEST_TYPE === 'performance'
    runId = await getTestRun(platform, smoke, perf)
    console.log(`------------Starting test run on AWS Device Farm------------`)
    console.log(`Platform: ${platform}`)
    console.log(`Device: ${deviceName}`)
    console.log(`OS Version: ${platformVersion}`)
    if (deviceUdid) {
      console.log(`Device UDID: ${deviceUdid}`)
    }
    if (chromedriverExecutableDir) {
      console.log(`ChromeDriver Dir: ${chromedriverExecutableDir}`)
    }
  },

  // hoook beforeTest: make or get testSection before test
  beforeTest: async test => {
    const sectionTitle = test.parent
    sectionCache[sectionTitle] = await getSection(sectionTitle)
    console.log('TEST: ', test.title)
  },

  after: async function () {
    console.log('------------Cleaning up session------------')
    await new Promise(res => setTimeout(res, 500))
  },

  afterHook: async function (test, _, result) {
    if (result?.error) {
      try {
        const pageSource = await driver.getPageSource()
        logPageSourceOnFailure(pageSource, { maxLog: 8000 })
      } catch (e) {
        console.error('Could not get page source:', e)
      }
    }
  },

  // hoook afterTest: make or get testCase and send result after test
  afterTest: async (test, _, { passed, error }) => {
    const sectionTitle = test.parent
    const sectionId = sectionCache[sectionTitle]
    const caseId = await getTestCase(test.title, sectionId)
    const statusId = passed ? 1 : 5

    if (!passed) {
      try {
        const pageSource = await driver.getPageSource()
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const sanitizedTestName = test.title
          .replace(/[^a-zA-Z0-9]/g, '_')
          .substring(0, 50)
        const pageSourcePath = path.join(
          projectRoot,
          `e2e-appium/page-source-failure-${sanitizedTestName}-${timestamp}.xml`
        )
        fs.writeFileSync(pageSourcePath, pageSource)
        console.log(`\n📄 Page source saved on test failure: ${pageSourcePath}`)
        logPageSourceOnFailure(pageSource)
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
