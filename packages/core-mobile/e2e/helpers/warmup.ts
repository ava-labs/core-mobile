import { device } from 'detox'
import CommonElsPage from '../pages/commonEls.page'
import Assert from '../helpers/assertions'
import Action from './actions'
import { Platform } from './constants'

export const warmup = async () => {
  await device.launchApp()

  // if we are running Android e2e on Bitrise, we also need to handle the Jailbroken overlay
  if (Boolean(process.env.E2E) && Action.platform() === Platform.Android) {
    await Assert.isVisible(CommonElsPage.jailbrokenWarning, 1)
    await Action.tapElementAtIndex(by.text('Ok'), 0)
    console.log('Jailbroken warning handled!!!')
  }
}
