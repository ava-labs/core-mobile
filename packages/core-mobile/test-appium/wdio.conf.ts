import path from 'path'
import {
  addCaseToRun,
  getSection,
  getTestCase,
  getTestRun,
  sendResult
} from './testrail/testrail.service'

let runId: number | undefined
const sectionCache: Record<string, number> = {}
const isBitrise = process.env.CI === 'true'
const iosPath = isBitrise
  ? process.env.BITRISE_APP_DIR_PATH
  : path.resolve(
      './ios/DerivedData/Build/Products/Debug-iphonesimulator/AvaxWallet.app'
      // '/Users/eunji.song/Downloads/AvaxWalletInternal.app'
    )
const androidPath = isBitrise
  ? process.env.BITRISE_APK_PATH
  : path.resolve(
      './android/app/build/outputs/apk/internal/debug/app-internal-debug.apk'
      // '/Users/eunji.song/Downloads/app-internal-e2e-bitrise-signed.apk'
    )
const platformToRun = process.env.PLATFORM
const allCaps = [
  {
    platformName: 'Android',
    'appium:deviceName': 'emulator-5554',
    'appium:platformVersion': '14.0',
    'appium:automationName': 'UiAutomator2',
    'appium:app': androidPath,
    'appium:appWaitActivity': '*',
    'appium:autoGrantPermissions': true,
    'appium:settings[snapshotMaxDepth]': 70,
    'appium:isHeadless': true,
    'appium:newCommandTimeout': 120,
    'appium:adbExecTimeout': 60000,
    'appium:uiautomator2ServerLaunchTimeout': 60000,
    'appium:uiautomator2ServerInstallTimeout': 60000
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
    'appium:isHeadless': true
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
  specFileRetries: 1,
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
  },

  // hoook beforeTest: make or get testSection before test
  beforeTest: async test => {
    const sectionTitle = test.parent
    sectionCache[sectionTitle] = await getSection(sectionTitle)
  },

  // hoook afterTest: make or get testCase and send result after test
  afterTest: async (test, _, { passed }) => {
    const sectionTitle = test.parent
    const sectionId = sectionCache[sectionTitle]
    const caseId = await getTestCase(test.title, sectionId)
    const statusId = passed ? 1 : 5
    if (runId) {
      await addCaseToRun(runId, caseId)
      await sendResult(runId, caseId, statusId)
    } else {
      console.error('testRun not found')
    }
  }
}
