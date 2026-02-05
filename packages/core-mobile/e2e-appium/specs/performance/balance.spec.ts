import warmup from '../../helpers/warmup'
import { actions } from '../../helpers/actions'
import portfolioPage from '../../pages/portfolio.page'
import commonElsPage from '../../pages/commonEls.page'

describe('[Performance] Balance', () => {
  it('Portfolio Performance - Balance Header', async () => {
    await warmup()
    await actions.waitFor(commonElsPage.loadingSpinnerVisible)
    const start = performance.now()
    await portfolioPage.verifyBalanceHeader()
    await actions.assertPerformance(start)
  })
})
