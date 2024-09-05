import Assert from '../../helpers/assertions'
import { warmup } from '../../helpers/warmup'
import AccountManagePage from '../../pages/accountManage.page'
import CollectiblesPage from '../../pages/collectibles.page'

describe('NFT Error Messages', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should have NFT send warning - Unable to send token', async () => {
    await CollectiblesPage.tapAddressBook()
    await CollectiblesPage.tapMyAccounts()
    await AccountManagePage.tapFirstAccount()
    await Assert.isVisible(CollectiblesPage.warningGasLimitIsInvalid)
  })
})
