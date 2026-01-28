import path from 'path'
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
const isBitrise = process.env.CI === 'true'
const goHeadless = isBitrise ? true : false
const goRetry = isBitrise ? 1 : 0
const iosLocalPath = process.env.E2E_LOCAL_PATH
  ? '/Users/eunji.song/Downloads/AvaxWalletInternal.app'
  : './ios/Build/Products/Debug-iphonesimulator/AvaxWallet.app'
const androidLocalPath = process.env.E2E_LOCAL_PATH
  ? '/Users/eunji.song/Downloads/app-internal-e2e-bitrise-signed.apk'
  : './android/app/build/outputs/apk/internal/debug/app-internal-debug.apk'
const iosPath = isBitrise
  ? process.env.BITRISE_APP_DIR_PATH
  : path.resolve(iosLocalPath)
const androidPath = isBitrise
  ? process.env.BITRISE_APK_PATH
  : path.resolve(androidLocalPath)
const platformToRun = process.env.PLATFORM
const isSmoke = process.env.IS_SMOKE === 'true'
const isPerformance = process.env.IS_PERFORMANCE === 'true'
const allCaps = [
  {
    platformName: 'Android',
    'appium:deviceName': 'emulator-5554',
    'appium:platformVersion': '15.0',
    'appium:automationName': 'UiAutomator2',
    'appium:app': androidPath,
    // 'appium:appWaitActivity': '*',
    'appium:disableWindowAnimation': true,
    'appium:autoGrantPermissions': true,
    'appium:appWaitActivity': 'com.avaxwallet.MainActivity',
    'appium:appActivity': 'com.avaxwallet.MainActivity'
  },
  {
    platformName: 'iOS',
    // 'appium:noReset': true,
    'appium:deviceName': 'iPhone 16 Pro',
    'appium:waitForIdleTimeout': 0,
    'appium:maxTypingFrequency': 30,
    'appium:platformVersion': '18.4',
    'appium:automationName': 'xcuitest',
    'appium:app': iosPath,
    'appium:autoAcceptAlerts': true,
    'appium:autoDismissAlerts': true,
    'appium:wdaStartupRetries': 5,
    'appium:wdaStartupRetryInterval': 20000,
    'appium:usePrebuiltWDA': false,
    'appium:shouldUseSingletonTestManager': false,
    'appium:showXcodeLog': true,
    'appium:settings[snapshotMaxDepth]': 70,
    'appium:isHeadless': goHeadless
  }
]

const caps = platformToRun
  ? allCaps.filter(cap => cap.platformName.toLowerCase() === platformToRun)
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
  port: 4723,
  services: [['appium', { command: 'appium' }]],
  logLevel: 'error',
  bail: 0,
  waitforTimeout: 20000,
  specFileRetries: goRetry,
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
    runId = await getTestRun(platform, isSmoke, isPerformance)
    console.log(`------------Starting test run------------`)
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
