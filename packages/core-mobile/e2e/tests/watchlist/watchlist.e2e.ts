/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import BottomTabsPage from '../../pages/bottomTabs.page'
import { warmup } from '../../helpers/warmup'
import watchlistPage from '../../pages/watchlist.page'
import actions from '../../helpers/actions'

describe('Watchlist', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should navigate watchlist tabs', async () => {
    await BottomTabsPage.tapWatchlistTab()
    await actions.waitForElement(watchlistPage.favoritesTab, 10000)
    await watchlistPage.verifyFavorites(['AVAX', 'BTC', 'ETH'])
    await watchlistPage.tapAllTab()
    await watchlistPage.verifyAllTabs()
  })

  it('should reorder Favorites', async () => {
    await watchlistPage.tapFavoritesTab()
    await watchlistPage.reorderToken('AVAX')
    await watchlistPage.reorderToken('ETH')
    await watchlistPage.reorderToken('BTC')
  })

  // it('should navigate to token detail screen', async () => {
  //   await WatchListPage.tapWatchListToken('btc', 1)
  //   await Actions.waitForElement(tokenDetailPage.oneWeekTab)
  // })

  // it('should verify token detail screen', async () => {
  //   await Actions.swipeUp(tokenDetailPage.oneWeekTab, 'fast', 0.5, 0)
  //   await tokenDetailPage.verifyTokenDetailScreen()
  // })
})
