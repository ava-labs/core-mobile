/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Assert from '../../helpers/assertions'
import WatchListPage from '../../pages/watchlist.page'
import BottomTabsPage from '../../pages/bottomTabs.page'
import ExistingRecoveryPhrasePage from '../../pages/existingRecoveryPhrase.page'
import tokenDetailPage from '../../pages/tokenDetail.page'
import { warmup } from '../../helpers/warmup'

describe('Verify Watchlist', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should validate watchlist is shown', async () => {
    await Assert.isVisible(WatchListPage.newWalletIcon, 1)
    await Assert.isVisible(WatchListPage.newWalletBtn)
    await Assert.isVisible(WatchListPage.walletSVG, 1)
  })

  it('should navigate to watchlist', async () => {
    const recoveryPhrase: string = process.env.E2E_MNEMONIC as string
    await ExistingRecoveryPhrasePage.recoverWallet(recoveryPhrase)
    await BottomTabsPage.tapWatchlistTab()
    await BottomTabsPage.verifyBottomTabs()
  })

  it('should navigate to token detail screen', async () => {
    await WatchListPage.tapWatchListToken('btc')
  })

  it('should verify token detail screen', async () => {
    await tokenDetailPage.verifyTokenDetailScreen()
  })
})
