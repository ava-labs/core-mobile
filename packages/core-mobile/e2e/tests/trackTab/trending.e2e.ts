/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import BottomTabsPage from '../../pages/bottomTabs.page'
import { warmup } from '../../helpers/warmup'
import watchlist from '../../pages/watchlist.page'
import actions from '../../helpers/actions'
import tokenDetailPage from '../../pages/tokenDetail.page'
import commonElsPage from '../../pages/commonEls.page'

describe('Watchlist trending tab', () => {
  beforeAll(async () => {
    await warmup()
    await device.disableSynchronization()
  })

  it('should verify top trending token detail', async () => {
    await BottomTabsPage.tapWatchlistTab()
    await actions.waitForElement(watchlist.trendingTab, 20000)
    const topToken = await watchlist.getTopToken()
    const name = topToken[0] as string
    const symbol = topToken[1] as string
    const value = topToken[2] as number
    await watchlist.tapTopTrendingToken()
    await tokenDetailPage.verifyTokenDetailHeader(name, symbol, value)
    await commonElsPage.goBack()
  })

  it('should verify top trending token navigations', async () => {
    await watchlist.topTrendingTokenOnWatchlist()
    // const topToken = await watchlist.getTopToken()
    // const symbol = topToken[1] as string
    await watchlist.topTrendingTokenBuyFlow()
    await watchlist.topTrendingTokenDetailBuyFlow()
    await watchlist.topTrendingTokenDetailSwapFlow()
    await commonElsPage.goBack()
  })

  it('should verify trending tokens', async () => {
    await watchlist.verifyTrendingTokens()
  })
})
