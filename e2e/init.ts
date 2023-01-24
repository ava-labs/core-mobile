export {}
import { device } from 'detox'

beforeAll(async () => {
  // custom setup

  console.log('Initializing Detox')
  // await detox.init(config, { launchApp: false })
  global.platform = device.getPlatform()
})
