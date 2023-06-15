import { device } from 'detox'
import WatchListPage from '../pages/watchlist.page'
import Assert from './assertions'
import Action from './actions'
import { Platform } from './constants'

export const warmup = async () => {
  await device.launchApp({ permissions: { camera: 'YES' } })

  // if we are running Android e2e on Bitrise, we also need to handle the Jailbroken overlay
  if (Boolean(process.env.E2E) && Action.platform() === Platform.Android) {
    await Assert.isVisible(by.text('Jailbroken'))
    await Action.tap(by.text('Ok'))
  }

  await Assert.isVisible(WatchListPage.walletSVG, 1)
}
