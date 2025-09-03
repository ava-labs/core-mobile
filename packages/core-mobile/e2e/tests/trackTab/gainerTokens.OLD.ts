/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import assert from 'assert'
import { warmup } from '../../helpers/warmup'
import watchlistPage from '../../pages/track.page'
import bottomTabsPage from '../../pages/bottomTabs.page'
import actions from '../../helpers/actions'
import { Coin } from '../../helpers/tokens'

describe('Gainers Tokens', () => {
  let tokens: Coin[] = []

  beforeAll(async () => {
    // get gainers token from CoinGecko API
    tokens = await watchlistPage.getGainers()
    await warmup()
  })

  it('should verify gainers list', async () => {
    // get gainers list on watchlist page
    await bottomTabsPage.tapWatchlistTab()
    await watchlistPage.tapAllTab()
    await watchlistPage.tapSortBtn()
    await watchlistPage.selectSortOption('Gainers')
    await actions.waitForElement(by.text(`Sort by: Gainers`))

    // Verify the token we grab on CoinGecko API displayed on the gainer list
    // the list on the app & api could be different. We're allowing 3 tries to verify the list
    let gainersTry = 6
    for (const token of tokens) {
      try {
        await actions.waitForElement(by.id(`watchlist_item__${token.symbol}`))
        await watchlistPage.verifyTokenRow(token, 15)
      } catch (e) {
        gainersTry--
        console.log(`Gainers list is not correct, ${gainersTry} tries left`)
      }
    }
    assert(gainersTry > 0, 'Gainers list is not correct')
  })

  // it('should verify top 5 Gainers', async () => {
  //   await bottomTabsPage.tapWatchlistTab()
  //   for (const token of tokens) {
  //     await watchlistPage.searchToken(token.symbol)
  //     await watchlistPage.verifyTokenRow(token)
  //   }
  // })
})
