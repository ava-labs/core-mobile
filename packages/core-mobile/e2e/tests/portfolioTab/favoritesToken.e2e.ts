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
  })

  it('should verify adding token to favorite', async () => {
    await LoginRecoverWallet.recoverWalletLogin()
    await PortfolioPage.tapAddToWatchlist()
    await WatchListPage.tapWatchListToken('btc')
    await Actions.waitForElement(TokenDetailPage.favorite)
    await TokenDetailPage.tapFavorite()
    await TokenDetailPage.tapBackButton()
    await BottomTabsPage.tapWatchlistTab()
    await WatchListPage.tapFavoritesTab()
    await Actions.waitForElement(WatchListPage.watchListTokenBtc)
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
