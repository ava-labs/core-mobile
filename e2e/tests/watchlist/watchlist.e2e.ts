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
import Actions from '../../helpers/actions'

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
    const startTime = new Date().getTime()
    await Actions.waitForElement(WatchListPage.favoritesTab)
    const endTime = new Date().getTime()
    await Actions.reportUIPerformance(
      startTime,
      endTime,
      'performanceWatchlistScreen',
      1,
      3
    )
    await BottomTabsPage.verifyBottomTabs()
  })

  it('should navigate to token detail screen', async () => {
    await WatchListPage.tapWatchListToken('btc')
    const startTime2 = new Date().getTime()
    await Actions.waitForElement(tokenDetailPage.oneWeekTab)
    const endTime2 = new Date().getTime()
    await Actions.reportUIPerformance(
      startTime2,
      endTime2,
      'performanceTokenDetailScreen',
      1,
      3
    )
  })

  it('should verify token detail screen', async () => {
    await Actions.swipeUp(tokenDetailPage.oneWeekTab, 'fast', 0.5, 0)
    await tokenDetailPage.verifyTokenDetailScreen()
  })
})
