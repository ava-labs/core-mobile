import warmup from '../../../helpers/warmup'
import settingsPage from '../../../pages/settings.page'
import txPage from '../../../pages/transactions.page'
import txLoc from '../../../locators/transactions.loc'
import commonPage from '../../../pages/commonEls.page'
import commonLoc from '../../../locators/commonEls.loc'
import portfolioPage from '../../../pages/portfolio.page'

describe('Send AVAX on P-Chain', () => {
  before(async () => {
    await warmup()
    await settingsPage.createNthAccount()
    await commonPage.filter(commonLoc.pChain)
    await portfolioPage.tapToken()
  })

  it('should send AVAX on P-Chain', async () => {
    await txPage.send(undefined, txLoc.sendingAmount)
    await txPage.verifySuccessToast()
  })
})
