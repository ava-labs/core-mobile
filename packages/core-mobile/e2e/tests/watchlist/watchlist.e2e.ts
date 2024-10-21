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
    await actions.waitForElementNoSync(by.text('Sort by: Market Cap'), 10000)
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
    await actions.waitForElementNoSync(watchlistPage.allTab, 10000)
    await watchlistPage.tapAllTab()
    await actions.waitForElementNoSync(by.text('Sort by: Market Cap'), 10000)
    for (const option of sortOptions) {
      const beforeSort = await watchlistPage.getTopTokenPriceFromList()
      await watchlistPage.tapSortBtn()
      await watchlistPage.verifyWatchlistDropdownItems(previousOption)
      await watchlistPage.selectSortOption(option)
      await actions.waitForElementNoSync(by.text(`Sort by: ${option}`), 2000)
      const afterSort = await watchlistPage.getTopTokenPriceFromList()
      assert.notEqual(beforeSort, afterSort)
      previousOption = option
    }
  })
})
