import warmup from '../../helpers/warmup'
import { actions } from '../../helpers/actions'
import portfolioPage from '../../pages/portfolio.page'

describe('[Performance] Balance', () => {
  before(async () => {
    await warmup()
  })

  it('Portfolio Performance - Balance Header', async () => {
    const start = performance.now()
    await portfolioPage.verifyBalanceHeader()
    await actions.assertPerformance(start)
  })
})
