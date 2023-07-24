/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import BottomTabsPage from '../../pages/bottomTabs.page'
import Actions from '../../helpers/actions'
import Assert from '../../helpers/assertions'
import WatchListPage from '../../pages/watchlist.page'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import PortfolioPage from '../../pages/portfolio.page'
import TokenDetailPage from '../../pages/tokenDetail.page'
import { warmup } from '../../helpers/warmup'

describe('Favorites Token', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('should verify adding token to favorite', async () => {
    await PortfolioPage.tapAddToWatchlist()
    await WatchListPage.tapWatchListToken('btc')
    const startTime = new Date().getTime()
    await Actions.waitForElement(TokenDetailPage.favorite)
    const endTime = new Date().getTime()
    await Actions.reportUIPerformance(
      startTime,
      endTime,
      'TokenDetailScreen',
      1,
      3
    )
    await TokenDetailPage.tapFavorite()
    await TokenDetailPage.tapBackButton()
    await BottomTabsPage.tapWatchlistTab()
    await WatchListPage.tapFavoritesTab()
    const startTime2 = new Date().getTime()
    await Actions.waitForElement(WatchListPage.watchListTokenBtc)
    const endTime2 = new Date().getTime()
    await Actions.reportUIPerformance(
      startTime2,
      endTime2,
      'FavoritesTokenScreen',
      1,
      3
    )
    await Assert.isVisible(WatchListPage.watchListTokenBtc)
    await BottomTabsPage.tapPortfolioTab()
    await Assert.isVisible(PortfolioPage.btcTokenItem)
  })

  it('should verify removing token from favorite', async () => {
    await PortfolioPage.tapBtcFavoriteToken()
    await TokenDetailPage.tapFavorite()
    await TokenDetailPage.tapBackButton()
    await Assert.isNotVisible(PortfolioPage.btcTokenItem)
    await Assert.isVisible(PortfolioPage.addToWatchlist)
    await PortfolioPage.tapAddToWatchlist()
    await WatchListPage.tapFavoritesTab()
    await Assert.isNotVisible(WatchListPage.watchListTokenBtc)
  })
})
