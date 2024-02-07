import AccountManagePage from '../../pages/accountManage.page'
import Actions from '../../helpers/actions'
import Assert from '../../helpers/assertions'
import PortfolioPage from '../../pages/portfolio.page'
import CollectiblesPage from '../../pages/collectibles.page'
import { warmup } from '../../helpers/warmup'

describe('Send Avax to another account', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should verify Address Required warning', async () => {
    await PortfolioPage.tapCollectiblesTab()
    await Actions.waitForElement(CollectiblesPage.gridItem, 5000)
    await CollectiblesPage.tapGridItem()
    await CollectiblesPage.tapSendButton()
    await Assert.isVisible(CollectiblesPage.warningAddressRequired)
  })

  it('Should verify Insufficient balance for fee warning', async () => {
    await CollectiblesPage.tapAddressBook()
    await CollectiblesPage.tapMyAccounts()
    await AccountManagePage.tapFirstAccount()
    await CollectiblesPage.tapCustomFeeButton()
    await CollectiblesPage.inputCustomFee()
    await Assert.isVisible(CollectiblesPage.warningInsufficientFee)
  })
})
