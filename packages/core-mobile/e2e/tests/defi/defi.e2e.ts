import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import AccountManagePage from '../../pages/accountManage.page'
// import Actions from '../../helpers/actions'
// import Assert from '../../helpers/assertions'
import PortfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'
import DefiPage from '../../pages/defi.page'

describe('Defi Tab', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should verify Defi Items', async () => {
    await AccountManagePage.createAccount(2)
    await PortfolioPage.tapDefiTab()
    await DefiPage.verifyEmptyScreenItems()
  })

  // it('Should verify Insufficient balance for fee warning', async () => {
  //   await CollectiblesPage.tapAddressBook()
  //   await CollectiblesPage.tapMyAccounts()
  //   await AccountManagePage.tapFirstAccount()
  //   await CollectiblesPage.tapCustomFeeButton()
  //   await CollectiblesPage.inputCustomFee()
  //   await Assert.isVisible(CollectiblesPage.warningInsufficientFee)
  // })
})
