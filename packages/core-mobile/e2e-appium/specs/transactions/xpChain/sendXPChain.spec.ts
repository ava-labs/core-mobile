import warmup from '../../../helpers/warmup'
import txPage from '../../../pages/transactions.page'
import txLoc from '../../../locators/transactions.loc'
import portfolioPage from '../../../pages/portfolio.page'
import commonElsPage from '../../../pages/commonEls.page'
import commonElsLoc from '../../../locators/commonEls.loc'

describe('[Smoke] Send transaction', () => {
  it('should send AVAX on P-Chain', async () => {
    // login & create account
    await warmup()
    await commonElsPage.filter(commonElsLoc.pChain)
    await portfolioPage.tapToken()
    // Send
    await txPage.send(undefined, txLoc.sendingAmount)
    await txPage.verifySuccessToast()
    await commonElsPage.goBack()
  })

  it('should send AVAX on X-Chain', async () => {
    // login & create account
    await commonElsPage.filter(commonElsLoc.xChain)
    await portfolioPage.tapToken()
    // Send
    await txPage.send(undefined, txLoc.sendingAmount)
    await txPage.verifySuccessToast()
  })
})
