import txPage from '../../../pages/transactions.page'
import common from '../../../pages/commonEls.page'
import commonLoc from '../../../locators/commonEls.loc'
import portfolioPage from '../../../pages/portfolio.page'
import warmup from '../../../helpers/warmup'

describe('Send transaction', () => {
  it('should send NFT on C-Chain', async () => {
    await warmup()
    await portfolioPage.tapCollectiblesTab()
    await common.filter(commonLoc.cChain)
    await txPage.sendNft()
    await txPage.verifySuccessToast()
  })
})
