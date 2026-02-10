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
const appiumServerUrl = process.env.AWS_DEVICE_FARM_APPIUM_SERVER_URL || 'http://localhost:4723'
const appPath = process.env.AWS_DEVICE_FARM_APP_PATH || ''
const platformToRun = process.env.PLATFORM || process.env.DEVICEFARM_DEVICE_PLATFORM_NAME

// Device Farm provides device info via environment variables
const deviceName = process.env.DEVICEFARM_DEVICE_NAME || 'device'
const platformVersion = process.env.DEVICEFARM_DEVICE_OS_VERSION || '14.0'
const deviceUdid = process.env.DEVICEFARM_DEVICE_UDID || ''
const chromedriverExecutableDir = process.env.DEVICEFARM_CHROMEDRIVER_EXECUTABLE_DIR || ''

const allCaps = [
  {
    platformName: 'Android',
    'appium:deviceName': deviceName,
    'appium:platformVersion': platformVersion,
    'appium:automationName': 'UiAutomator2',
    'appium:app': appPath,
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
    'appium:deviceName': deviceName,
    'appium:waitForIdleTimeout': 0,
    'appium:maxTypingFrequency': 30,
    'appium:platformVersion': platformVersion,
    'appium:automationName': 'xcuitest',
    'appium:app': appPath,
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
  ? allCaps.filter(cap => cap.platformName.toLowerCase() === platformToRun.toLowerCase())
  : allCaps

export const config: WebdriverIO.Config = {
  runner: 'local',
  tsConfigPath: './tsconfig.json',
  specs: ['./specs/**/*.ts'],
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
        protocol: (new URL(appiumServerUrl).protocol.slice(0, -1) as 'http' | 'https') || 'http'
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
    runId = await getTestRun(platform)
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

  // hoook afterTest: make or get testCase and send result after test
  afterTest: async (test, _, { passed, error }) => {
    const sectionTitle = test.parent
    const sectionId = sectionCache[sectionTitle]
    const caseId = await getTestCase(test.title, sectionId)
    const statusId = passed ? 1 : 5
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

