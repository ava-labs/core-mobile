import warmup from '../../helpers/warmup'
import { actions } from '../../helpers/actions'
import portfolioPage from '../../pages/portfolio.page'
import commonElsPage from '../../pages/commonEls.page'
import commonEls from '../../locators/commonEls.loc'

describe('[Performance] Portfolio - Assets Tab', () => {
  it('Assets performance after onboarding', async () => {
    await warmup()
    await actions.waitFor(commonElsPage.loadingSpinnerVisible)
    const start = performance.now()
    await portfolioPage.verifyAssetsList()
    await actions.assertPerformance(start)
  })

  it('Assets performance after switching account', async () => {
    await commonElsPage.switchAccount(commonEls.secondAccount)
    const start = performance.now()
    await portfolioPage.verifyAssetsList()
    await actions.assertPerformance(start)
  })
})
