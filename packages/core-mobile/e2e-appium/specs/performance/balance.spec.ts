import warmup from '../../helpers/warmup'
import { actions } from '../../helpers/actions'
import portfolioPage from '../../pages/portfolio.page'

describe('[Performance] Balance', () => {
  it('Portfolio Performance - Balance Header', async () => {
    await warmup()
    const start = performance.now()
    await portfolioPage.verifyBalanceHeader()
    await actions.assertPerformance(start)
  })
})
