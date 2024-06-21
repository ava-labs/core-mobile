import AccountManagePage from '../../pages/accountManage.page'
import Actions from '../../helpers/actions'
import PortfolioPage from '../../pages/portfolio.page'
import CollectiblesPage from '../../pages/collectibles.page'
import { warmup } from '../../helpers/warmup'
import approveTransactionPage from '../../pages/approveTransaction.page'
import assertions from '../../helpers/assertions'

describe('Send Avax to another account', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should verify NFT Details items', async () => {
    await AccountManagePage.createSecondAccount()
    await PortfolioPage.tapCollectiblesTab()
    await CollectiblesPage.tapParadiseTycoonFurnituresNFT()
    await CollectiblesPage.verifyNftDetailsItems()
  })

  it('Should send NFT to second account', async () => {
    await Actions.waitForElement(
      approveTransactionPage.successfulToastMsg,
      120000
    )
    await Actions.waitForElementNotVisible(
      approveTransactionPage.successfulToastMsg,
      30000
    )

    await AccountManagePage.tapAccountMenu()
    await AccountManagePage.tapSecondAccount()
    await CollectiblesPage.refreshCollectiblesPage()
    await assertions.isVisible(CollectiblesPage.paradiseTycoonFurnituresNFT)
  })
})
