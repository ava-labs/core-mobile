import { device } from 'detox'
import CommonElsPage from '../pages/commonEls.page'
import Assert from '../helpers/assertions'
import Action from './actions'
import { Platform } from './constants'
import loginRecoverWallet from './loginRecoverWallet'

export const warmup = async () => {
  await device.launchApp({
    permissions: { notifications: 'YES', camera: 'YES' }
  })

  // if we are running Android e2e on Bitrise, we also need to handle the Jailbroken overlay
  const jailbrokenWarningPrsent = CommonElsPage.jailbrokenWarning
  if (
    process.env.E2E === 'true' &&
    Action.platform() === Platform.Android &&
    (await Action.isVisible(jailbrokenWarningPrsent, 0))
  ) {
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
