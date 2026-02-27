/**
 * E2E API Login Config
 *
 * Passes E2E_MNEMONIC env to app via launch args for auto login.
 *
 * Run: PLATFORM=ios yarn appium:e2eApiLogin
 *      PLATFORM=android yarn appium:e2eApiLogin
 */
import path from 'path'

const isBitrise = process.env.CI === 'true'
const goHeadless = isBitrise ? true : false
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

const baseAndroidCaps = {
  platformName: 'Android',
  'appium:deviceName': 'emulator-5554',
  'appium:platformVersion': '15.0',
  'appium:automationName': 'UiAutomator2',
  'appium:app': androidPath,
  'appium:appWaitActivity': '*',
  'appium:disableWindowAnimation': true,
  'appium:autoGrantPermissions': true
}

const baseIosCaps = {
  platformName: 'iOS',
  'appium:deviceName': 'iPhone 17 Pro',
  'appium:waitForIdleTimeout': 0,
  'appium:maxTypingFrequency': 30,
  'appium:platformVersion': '26.0',
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

const allCaps = [
  { ...baseAndroidCaps } as WebdriverIO.Capabilities,
  { ...baseIosCaps } as WebdriverIO.Capabilities
]

const caps = platformToRun
  ? allCaps.filter(
      cap =>
        (cap.platformName as string)?.toLowerCase() === platformToRun
    )
  : allCaps

export const config: WebdriverIO.Config = {
  runner: 'local',
  tsConfigPath: './tsconfig.json',
  specs: ['./specs/e2eApiLogin/**/*.spec.ts'],
  maxInstances: 1,
  port: 4723,
  services: [['appium', { command: 'appium' }]],
  logLevel: 'error',
  bail: 0,
  waitforTimeout: 20000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 2,
  framework: 'mocha',
  reporters: ['spec'],
  capabilities: caps,
  mochaOpts: {
    ui: 'bdd',
    timeout: 600000
  },

  beforeSession: async (_, caps) => {
    const mnemonic = process.env.E2E_MNEMONIC
    if (!mnemonic) {
      throw new Error('E2E_MNEMONIC env is required')
    }

    const capsArray = Array.isArray(caps) ? caps : [caps]
    for (const cap of capsArray) {
      if (!cap) continue
      if (cap.platformName === 'Android') {
        cap['appium:optionalIntentArguments'] =
          `--es E2E_MNEMONIC "${mnemonic.replace(/"/g, '\\"')}"`
      } else if (cap.platformName === 'iOS') {
        cap['appium:processArguments'] = {
          args: ['-E2E_MNEMONIC', mnemonic]
        }
      }
    }
  },

  before: async () => {
    console.log('------------E2E API Login test run------------')
  }
}
