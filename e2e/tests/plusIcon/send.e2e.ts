/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { device } from 'detox'
import Assert from '../../helpers/assertions'
import WatchListPage from '../../pages/watchlist.page'
import PlusMenuPage from '../../pages/plusMenu.page'
import ExistingRecoveryPhrasePage from '../../pages/existingRecoveryPhrase.page'
import BottomTabsPage from '../../pages/bottomTabs.page'
import SendPage from '../../pages/send.page'

describe('Create new wallet', () => {
  beforeAll(async () => {
    await device.launchApp()
    await Assert.isVisible(WatchListPage.walletSVG, 1)
  })

  it('should validate watchlist is shown', async () => {
    await Assert.isVisible(WatchListPage.newWalletIcon, 1)
    await Assert.isVisible(WatchListPage.newWalletBtn)
    await Assert.isVisible(WatchListPage.walletSVG, 1)
  })

  it('should navigat to send screen', async () => {
    const recoveryPhrase: string = process.env.RECOVERY_PHRASE as string
    await ExistingRecoveryPhrasePage.recoverWallet(recoveryPhrase)
    await BottomTabsPage.tapPlusIcon()
    await PlusMenuPage.tapSendButton()
    const walletAddress: string = process.env.TEST_ADDRESS as string
    await SendPage.enterWalletAddress(walletAddress)
  })
})
