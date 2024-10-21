/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import assert from 'assert'
import BottomTabsPage from '../../pages/bottomTabs.page'
import { warmup } from '../../helpers/warmup'
import watchlistPage from '../../pages/watchlist.page'
import actions from '../../helpers/actions'
import { TokenDetailToken } from '../../helpers/tokens'
import commonElsPage from '../../pages/commonEls.page'

describe('Watchlist', () => {
  const tokens: TokenDetailToken[] = [
    { id: 'avalanche-2', symbol: 'AVAX', name: 'avalanche' },
    { id: 'bitcoin', symbol: 'BTC', name: 'bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'ethereum' }
  ]

  beforeAll(async () => {
    await warmup()
    await device.disableSynchronization()
  })

  afterAll(async () => {
    await device.enableSynchronization()
  })

  it('should navigate watchlist tabs', async () => {
    await BottomTabsPage.tapWatchlistTab()
    await actions.waitForElementNoSync(watchlistPage.favoritesTab, 10000)
    await watchlistPage.verifyFavorites(['AVAX', 'BTC', 'ETH'])
    await watchlistPage.tapAllTab()
    await actions.waitForElementNoSync(watchlistPage.allWatchList, 10000)
  })

  it('should reorder Favorites', async () => {
    await BottomTabsPage.tapWatchlistTab()
    await actions.waitForElementNoSync(watchlistPage.favoritesTab)
    await watchlistPage.tapFavoritesTab()
    let i = 0
    while (i < 5) {
      const token = actions.shuffleArray(tokens)[0]
      if (token) {
        await watchlistPage.reorderToken(token.id)
      }
      i++
    }
  })

  it('should sort on All tab', async () => {
    let previousOption = 'Market Cap'
    const sortOptions = ['Price', 'Volume', 'Gainers', 'Losers']
    await watchlistPage.tapAllTab()
    await actions.waitForElementNoSync(watchlistPage.allWatchList)
    for (const option of sortOptions) {
      const beforeSort = await watchlistPage.getTopTokenFromList()
      await commonElsPage.tapCarrotSVG()
      await watchlistPage.verifyWatchlistDropdownItems(previousOption)
      await watchlistPage.selectSortOption(option)
      await watchlistPage.verifySortOption(option)
      const afterSort = await watchlistPage.getTopTokenFromList()
      assert.notEqual(beforeSort, afterSort)
      previousOption = option
    }
  })
})
