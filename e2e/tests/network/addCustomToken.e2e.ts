/* eslint-disable jest/expect-expect */
import Assert from '../../helpers/assertions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import PortfolioPage from '../../pages/portfolio.page'
import ManageTokensPage from '../../pages/manageTokens.page'
import { warmup } from '../../helpers/warmup'

describe('Add custom token', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('should add custom token', async () => {
    await PortfolioPage.tapAvaxNetwork()
    await PortfolioPage.tapManageTokens()
    await ManageTokensPage.tapAddcustomToken()
    await ManageTokensPage.inputCustomToken()
    await ManageTokensPage.tapAddButton()
    await ManageTokensPage.tapAddcustomToken()
    await ManageTokensPage.inputCustomToken()

    await Assert.isVisible(ManageTokensPage.addedMessage)
  })
})
