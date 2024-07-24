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

  it('Should verify NFT Details items and send NFT', async () => {
    await AccountManagePage.createSecondAccount()
    await PortfolioPage.tapCollectiblesTab()
    const accountNumber =
      await CollectiblesPage.tapParadiseTycoonFurnituresNFT()
    await CollectiblesPage.verifyNftDetailsItems()
    await CollectiblesPage.sendNft(accountNumber)
    await Actions.waitForElement(
      approveTransactionPage.successfulToastMsg,
      120000
    )
    await Actions.waitForElementNotVisible(
      approveTransactionPage.successfulToastMsg,
      30000
    )
    await AccountManagePage.tapAccountDropdownTitle()
    await AccountManagePage.switchToReceivedAccount(accountNumber)
    await assertions.isVisible(CollectiblesPage.paradiseTycoonFurnituresNFT)
  }, 300000)
})
