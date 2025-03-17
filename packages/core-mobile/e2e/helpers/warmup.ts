import { device } from 'detox'
import { DeviceLaunchAppConfig } from 'detox/detox'
import CommonElsPage from '../pages/commonEls.page'
import Assert from '../helpers/assertions'
import commonElsPage from '../pages/commonEls.page'
import Action from './actions'
import { Platform } from './constants'
import loginRecoverWallet from './loginRecoverWallet'
import delay from './waits'

export const warmup = async (newInstance = false) => {
  const initialArgs: DeviceLaunchAppConfig = {
    permissions: { notifications: 'YES', camera: 'YES' },
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

  // Switch to the new gen for 15 secs on your local machine.
  // I'll remove delay(15000) once the new gen is set to default
  await delay(15000)
  await loginRecoverWallet.recoverWalletLogin()
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
