import txPage from '../../../pages/transactions.page'
import common from '../../../pages/commonEls.page'
import commonLoc from '../../../locators/commonEls.loc'
import portfolio from '../../../pages/portfolio.page'
import warmup from '../../../helpers/warmup'

describe('Send transaction', () => {
  it('should send NFT on C-Chain', async () => {
    await warmup()
    await portfolio.tapCollectiblesTab()
    await common.filter(commonLoc.ethereum)
    await portfolio.selectView()
    await txPage.sendNft('Untitled')
    await txPage.verifySuccessToast()
  })
})
