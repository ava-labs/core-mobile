/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
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

  it('should navigate to watchlist', async () => {
    const recoveryPhrase: string = process.env.E2E_MNEMONIC as string
    await ExistingRecoveryPhrasePage.recoverWallet(recoveryPhrase)
    await BottomTabsPage.tapWatchlistTab()
    await Actions.waitForElement(WatchListPage.favoritesTab)
    await BottomTabsPage.verifyBottomTabs()
  })

  it('should navigate to token detail screen', async () => {
    await WatchListPage.tapWatchListToken('btc')
    await Actions.waitForElement(tokenDetailPage.oneWeekTab)
  })

  it('should verify token detail screen', async () => {
    await Actions.swipeUp(tokenDetailPage.oneWeekTab, 'fast', 0.5, 0)
    await tokenDetailPage.verifyTokenDetailScreen()
  })
})
