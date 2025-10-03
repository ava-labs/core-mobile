/* eslint-disable jest/no-disabled-tests */
import warmup from '../../../helpers/warmup'
import txPage from '../../../pages/transactions.page'
import txLoc from '../../../locators/transactions.loc'
import commonPage from '../../../pages/commonEls.page'
import commonLoc from '../../../locators/commonEls.loc'
import portfolioPage from '../../../pages/portfolio.page'

describe.skip('Send transaction', () => {
  it('should send AVAX on X-Chain', async () => {
    // login & create account
    await warmup(true)

    // Go to X-Chain & token detail
    await commonPage.filter(commonLoc.pChain)
    await portfolioPage.tapToken()

    // Send
    await txPage.send(undefined, txLoc.sendingAmount)
    await txPage.verifySuccessToast()
  })
})
