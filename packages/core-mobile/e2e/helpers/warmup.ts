import { device } from 'detox'
import { DeviceLaunchAppConfig, DevicePermissions } from 'detox/detox'
import CommonElsPage from '../pages/commonEls.page'
import Assert from '../helpers/assertions'
import commonElsPage from '../pages/commonEls.page'
import Action from './actions'
import { Platform } from './constants'
import loginRecoverWallet from './loginRecoverWallet'
import delay from './waits'

export const warmup = async (newInstance = false) => {
  const permissions: DevicePermissions = { notifications: 'YES', camera: 'YES' }
  const initialArgs: DeviceLaunchAppConfig = {
    permissions: permissions,
    launchArgs: {
      detoxURLBlacklistRegex: [
        '.*cloudflare-ipfs.*',
        '.*[ipfs.io/ipfs].*',
        '.*[amazonaws.com].*',
        '*facebook.react.*'
      ]
    }
  }
  if (newInstance) {
    initialArgs.newInstance = true
  }
  await device.launchApp(initialArgs)

  // Jailbreak Check
  if (await Action.isVisible(CommonElsPage.jailbrokenWarning, 0)) {
    console.log('Handling Jailbroken warning...')
    await Action.tapElementAtIndex(by.text('Ok'), 0)
    await Action.waitForElementNotVisible(CommonElsPage.jailbrokenWarning)
    console.log('Jailbroken warning handled!!!')
  }

  // Metro Dev Menu Check
  try {
    await commonElsPage.exitMetro()
  } catch (e) {
    console.log('Metro dev menu is not found...')
  }
  await delay(30000)
  // Login Check
  // try {
  await loginRecoverWallet.recoverWalletLogin()
  // } catch (e) {
  //   console.log('Skipped login process...')
  // }
}

export const handleJailbrokenWarning = async () => {
  if (process.env.E2E === 'true' && Action.platform() === Platform.Android) {
    console.log('Handling Jailbroken warning...', process.env.E2E)
    await Assert.isVisible(CommonElsPage.jailbrokenWarning, 0)
    await Action.tapElementAtIndex(by.text('Ok'), 0)
    await Action.waitForElementNotVisible(
      CommonElsPage.jailbrokenWarning,
      20,
      0
    )
    console.log('Jailbroken warning handled!!!')
  }
}
