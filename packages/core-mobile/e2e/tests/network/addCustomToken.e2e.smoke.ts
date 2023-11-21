import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import PortfolioPage from '../../pages/portfolio.page'
import ManageTokensPage from '../../pages/manageTokens.page'
import { warmup } from '../../helpers/warmup'

describe('Add custom token', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should add custom token', async () => {
    await LoginRecoverWallet.recoverWalletLogin()
    await PortfolioPage.tapAvaxNetwork()
    await Actions.waitForElement(PortfolioPage.manageTokens)
    await PortfolioPage.tapManageTokens()
    await Actions.waitForElement(ManageTokensPage.addcustomToken)
    await ManageTokensPage.tapAddcustomToken()
    await Actions.waitForElement(ManageTokensPage.inputContractAddress)
    await ManageTokensPage.inputCustomToken()
    await ManageTokensPage.tapAddButton()
    await ManageTokensPage.tapAddcustomToken()
    await ManageTokensPage.inputCustomToken()
    await Assert.isVisible(ManageTokensPage.addedMessage)
  })
})
