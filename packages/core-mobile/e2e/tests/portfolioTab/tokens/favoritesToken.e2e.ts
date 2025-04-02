/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import BottomTabsPage from '../../../pages/bottomTabs.page'
import Actions from '../../../helpers/actions'
import Assert from '../../../helpers/assertions'
import WatchListPage from '../../../pages/watchlist.page'
import PortfolioPage from '../../../pages/portfolio.page'
import TokenDetailPage from '../../../pages/tokenDetail.page'
import { warmup } from '../../../helpers/warmup'
import commonElsPage from '../../../pages/commonEls.page'

describe('Favorites Token', () => {
  beforeAll(async () => {
    await warmup()
  })

  let favorites = ['AVAX', 'BTC', 'ETH']
  const newToken = 'XRP'

  it('should have default favorite tokens on Favorites and Watchlist', async () => {
    // Display default favorites on WatchList Carousel
    await PortfolioPage.verifyWatchListCarousel(favorites)

    // Display default favorites on watchlist tab
    await BottomTabsPage.tapWatchlistTab()
    await WatchListPage.verifyFavorites(favorites)
  })

  it('should verify adding token to favorite', async () => {
    // Add token to favorite list
    favorites.push(newToken)
    await BottomTabsPage.tapWatchlistTab()
    await WatchListPage.searchToken(newToken)
    if (Actions.platform() === 'ios') {
      await Actions.dismissKeyboard()
    }
    await device.disableSynchronization()
    await WatchListPage.tapWatchListToken(newToken.toLowerCase(), 1)
    await Actions.waitForElement(TokenDetailPage.favorite)
    await TokenDetailPage.tapFavorite()
    await commonElsPage.goBack()
    await device.enableSynchronization()
  })

  it('should verify new token added to Favorites and Watchlist', async () => {
    // Verify watchlist items on watchlist tab
    await WatchListPage.clearSearchBar()
    await WatchListPage.verifyFavorites(favorites)

    // Verify watchlist items on portfolio tab
    await BottomTabsPage.tapPortfolioTab()
    await PortfolioPage.verifyWatchListCarousel(favorites)
  })

  it('should remove a token from Favorite', async () => {
    // Remove token from favorite list
    favorites = favorites.filter(fav => fav !== newToken)
    await device.disableSynchronization()
    await PortfolioPage.tapFavoriteToken(newToken)
    await Actions.waitForElement(TokenDetailPage.favorite)
    await TokenDetailPage.tapFavorite()
    await commonElsPage.goBack()
    await device.enableSynchronization()
  })

  it('should verify a token removal from Favorites', async () => {
    // Verify watchlist items on portfolio tab
    await PortfolioPage.verifyWatchListCarousel(favorites)
    await Assert.isNotVisible(
      by.id(`watchlist_carousel__${newToken.toLowerCase()}`)
    )

    // Verify watchlist items on watchlist tab
    await BottomTabsPage.tapWatchlistTab()
    await WatchListPage.verifyFavorites(favorites)
    await Assert.isNotVisible(
      by.id(`watchlist_item__${newToken.toLowerCase()}`)
    )
  })
})
