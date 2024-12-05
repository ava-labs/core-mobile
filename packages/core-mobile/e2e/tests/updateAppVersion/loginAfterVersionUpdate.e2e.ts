import { DeviceLaunchAppConfig, DevicePermissions } from 'detox/detox'
import assertions from '../../helpers/assertions'
import loginRecoverWallet from '../../helpers/loginRecoverWallet'
import portfolioPage from '../../pages/portfolio.page'
import delay from '../../helpers/waits'

const permissions: DevicePermissions = { notifications: 'YES', camera: 'YES' }
const initialArgs: DeviceLaunchAppConfig = {
  permissions: permissions,
  launchArgs: {
    detoxURLBlacklistRegex: [
      '.*cloudflare-ipfs.*',
      '.*[ipfs.io/ipfs].*',
      '.*[amazonaws.com].*'
    ],
    newInstance: true,
    detoxEnableSynchronization: 'NO'
  }
}

describe('Verify version update', () => {
  beforeEach(async () => {
    await device.launchApp(initialArgs)
    await loginRecoverWallet.enterPin()
  })

  it('should verify version update', async () => {
    await delay(30000)
    await assertions.isVisible(portfolioPage.collectiblesTab)
    console.log('Test passed if you see this message!')
  })
})
