import { DeviceLaunchAppConfig, DevicePermissions } from 'detox/detox'
import assertions from '../../helpers/assertions'
import { handleJailbrokenWarning } from '../../helpers/warmup'
import ExistingRecoveryPhrasePage from '../../pages/existingRecoveryPhrase.page'

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
  })

  it('Should verify pin screen is shown', async () => {
    await assertions.isVisible(ExistingRecoveryPhrasePage.forgotPinBtn)
  })
})
