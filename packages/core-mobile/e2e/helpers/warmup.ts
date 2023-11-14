import { device } from 'detox'
import CommonElsPage from '../pages/commonEls.page'
import existingRecoveryPhrasePage from '../pages/existingRecoveryPhrase.page'
import Assert from './assertions'
import Action from './actions'
import { Platform } from './constants'

export const warmup = async () => {
  await device.launchApp({ permissions: { camera: 'YES' } })

  // if we are running Android e2e on Bitrise, we also need to handle the Jailbroken overlay
  if (Boolean(process.env.E2E) && Action.platform() === Platform.Android) {
    await Assert.isVisible(CommonElsPage.jailbrokenWarning, 0)
    await Action.tap(by.text('Ok'))
    console.log('Jailbroken warning handled!!!')
  }

  await Assert.isVisible(existingRecoveryPhrasePage.alreadyHaveAWalletBtn, 0)
}
