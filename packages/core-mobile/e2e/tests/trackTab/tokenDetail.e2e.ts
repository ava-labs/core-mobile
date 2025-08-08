/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import PortfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'
import commonElsPage from '../../pages/commonEls.page'
import tokenDetailPage from '../../pages/tokenDetail.page'
import { TokenDetailToken } from '../../helpers/tokens'

describe('Token Detail on Market', () => {
  const tokens: TokenDetailToken[] = [
    { id: 'avalanche-2', symbol: 'AVAX', name: 'avalanche' },
    { id: 'bitcoin', symbol: 'BTC', name: 'bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'ethereum' }
  ]

  beforeAll(async () => {
    await tokenDetailPage.getTokensPrice(tokens).then(() => console.log(tokens))
    await warmup()
  })

  tokens.forEach(token => {
    test(`should verify ${token.symbol} Detail on market`, async () => {
      const { symbol, name, price } = token
      await device.disableSynchronization()
      await PortfolioPage.tapFavoriteToken(symbol)
      await tokenDetailPage.dismissHoldAndDrag()
      await tokenDetailPage.verifyTokenDetailHeader(name, symbol, price)
      await tokenDetailPage.verifyTokenDetailFooter(name)
      await tokenDetailPage.verifyTokenDetailContent()
      await commonElsPage.tapBackButton()
      await device.enableSynchronization()
    })
  })
})
