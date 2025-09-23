import path from 'path'
import {
  getSection,
  getTestCase,
  getTestRun,
  sendResult
} from './test-appium/testrail/testrail.service'

let runId: number | undefined
const sectionCache: Record<string, number> = {} // { '섹션1: 1 ,.... }
const isBitrise = process.env.CI === 'true'
const iosPath = isBitrise
  ? '/Users/vagrant/git/build/Build/Products/Release-iphonesimulator/Diary.app'
  : path.resolve('./ios/DerivedData/Debug-iphonesimulator/Diary.app')
const platformToRun = process.env.PLATFORM
const allCaps = [
  {
    // capabilities for local Appium web tests on an Android Emulator
    platformName: 'Android',
    'appium:deviceName': 'pixel_7',
    'appium:platformVersion': '15.0',
    'appium:automationName': 'UiAutomator2',
    'appium:app': path.resolve(
      './android/app/build/outputs/apk/debug/diary.apk'
    )
    // 'appium:noReset': true
  },
  {
    platformName: 'iOS',
    'appium:deviceName': 'iPhone 16 Pro',
    'appium:platformVersion': '18.4',
    'appium:automationName': 'xcuitest',
    'appium:app': iosPath
    // 'appium:noReset': true
  }
]

const caps = platformToRun
  ? allCaps.filter(cap => cap.platformName.toLowerCase() === platformToRun)
  : allCaps

export const config: WebdriverIO.Config = {
  runner: 'local',
  tsConfigPath: './test/tsconfig.json',
  specs: ['./test/specs/**/*.ts'],
  exclude: [
    // 'path/to/excluded/files'
    './test/specs/login.e2e.ts'
  ],
  maxInstances: 10,
  capabilities: caps,
  services: ['appium'],
  logLevel: 'error',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  },

  // 테스트 전에 딱 한 번 돌아가는 훅: testrun만들거나 겟할 예정입니다
  before: async () => {
    const platform = driver.isAndroid ? 'Android' : 'iOS'
    runId = await getTestRun(platform)
  },

  // 매번 테스트가 돌아갈때마다 한번씩 돌아가는 훅: test section만들거나 겟할 예정입니다
  beforeTest: async test => {
    const sectionTitle = test.parent
    sectionCache[sectionTitle] = await getSection(sectionTitle)
  },

  // 테스트 후에 진행될 훅: testcase만들거나 겟 + 결과값을 전송
  afterTest: async (test, _, { passed }) => {
    const sectionTitle = test.parent
    const sectionId = sectionCache[sectionTitle]
    const caseId = await getTestCase(test.title, sectionId)
    const statusId = passed ? 1 : 5
    if (runId) {
      await sendResult(runId, caseId, statusId)
    } else {
      console.error(
        '테스트런이 아예 만들어진적이 없어서 결과값을 추가할 수 없습니다!'
      )
    }
  }
}
