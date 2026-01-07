import warmup from '../../../helpers/warmup'
import txPage from '../../../pages/transactions.page'
import txLoc from '../../../locators/transactions.loc'
import commonPage from '../../../pages/commonEls.page'
import commonLoc from '../../../locators/commonEls.loc'
import portfolioPage from '../../../pages/portfolio.page'

describe('[Smoke] Send transaction', () => {
  it('should send AVAX on P-Chain', async () => {
    // login & create account
    await warmup()
    // Go to P-Chain & token detail
    await commonPage.filter(commonLoc.pChain)
    await portfolioPage.tapToken()
    // Send
    await txPage.send(undefined, txLoc.sendingAmount)
    await txPage.verifySuccessToast()
  })
})
