import { device } from 'detox'
import { DeviceLaunchAppConfig } from 'detox/detox'
import CommonElsPage from '../pages/commonEls.page'
import commonElsPage from '../pages/commonEls.page'
import Action from './actions'
import { Platform } from './constants'
import loginRecoverWallet from './loginRecoverWallet'

export const warmup = async () => {
  const initialArgs: DeviceLaunchAppConfig = {
    permissions: { notifications: 'YES', camera: 'YES' },
    newInstance: true,
    launchArgs: {
      detoxEnableSynchronization: false,
      detoxURLBlacklistRegex: [
        '.*cloudflare-ipfs.*',
        '.*[ipfs.io/ipfs].*',
        '.*[amazonaws.com].*',
        '*facebook.react.*'
      ]
    }
  }

  await device.launchApp(initialArgs)
  await device.disableSynchronization()

  // Jailbreak Check
  await handleJailbrokenWarning()

  // Metro Dev Menu Check
  await commonElsPage.exitMetro()

  // Login
  await loginRecoverWallet.login()
}

export const handleJailbrokenWarning = async () => {
  if (
    process.env.E2E === 'true' &&
    Action.platform() === Platform.Android &&
    (await Action.isVisible(CommonElsPage.jailbrokenWarning, 0))
  ) {
    await Action.tapElementAtIndex(by.text('Ok'), 0)
    await Action.waitForElementNotVisible(CommonElsPage.jailbrokenWarning)
    console.log('Jailbroken warning handled!!!')
  }
}
