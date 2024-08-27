import Actions from '../../helpers/actions'
import Assert from '../../helpers/assertions'
import { warmup } from '../../helpers/warmup'
import AccountManagePage from '../../pages/accountManage.page'
import CollectiblesPage from '../../pages/collectibles.page'
import PortfolioPage from '../../pages/portfolio.page'

describe('NFT Error Messages', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should verify NFT send address required warning', async () => {
    await PortfolioPage.tapCollectiblesTab()
    await Actions.waitForElement(CollectiblesPage.gridItem, 5000)
    await CollectiblesPage.tapGridItem()
    await CollectiblesPage.tapSendButton()
    await Assert.isVisible(CollectiblesPage.warningAddressRequired)
  })

  it('should verify NFT send Insufficient balance warning', async () => {
    await CollectiblesPage.tapAddressBook()
    await CollectiblesPage.tapMyAccounts()
    await AccountManagePage.tapFirstAccount()
    await Assert.isVisible(CollectiblesPage.warningGasLimitIsInvalid)
  })
})
