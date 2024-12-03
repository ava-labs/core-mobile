import { DeviceLaunchAppConfig, DevicePermissions } from 'detox/detox'
import assertions from '../../helpers/assertions'
import { handleJailbrokenWarning } from '../../helpers/warmup'
import loginRecoverWallet from '../../helpers/loginRecoverWallet'
import portfolioPage from '../../pages/portfolio.page'

const permissions: DevicePermissions = { notifications: 'YES', camera: 'YES' }
const initialArgs: DeviceLaunchAppConfig = {
  permissions: permissions,
  launchArgs: {
    detoxURLBlacklistRegex: [
      '.*cloudflare-ipfs.*',
      '.*[ipfs.io/ipfs].*',
      '.*[amazonaws.com].*'
    ]
  }
}

describe('Verify version update', () => {
  beforeAll(async () => {
    await device.launchApp(initialArgs)
    await handleJailbrokenWarning()
    await loginRecoverWallet.enterPin()
    await assertions.isVisible(portfolioPage.collectiblesTab)
  })
})
