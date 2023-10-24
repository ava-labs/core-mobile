/* eslint-disable jest/expect-expect */
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'
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
    const startTime = new Date().getTime()
    await Actions.waitForElement(PortfolioPage.manageTokens)
    const endTime = new Date().getTime()
    await Actions.reportUIPerformance(
      startTime,
      endTime,
      'NetworkAssetsScreen',
      1,
      3
    )
    await PortfolioPage.tapManageTokens()
    const startTime2 = new Date().getTime()
    await Actions.waitForElement(ManageTokensPage.addcustomToken)
    const endTime2 = new Date().getTime()
    await Actions.reportUIPerformance(
      startTime2,
      endTime2,
      'ManageTokensScreen',
      1,
      3
    )
    await ManageTokensPage.tapAddcustomToken()
    const startTime3 = new Date().getTime()
    await Actions.waitForElement(ManageTokensPage.inputContractAddress)
    const endTime3 = new Date().getTime()
    await Actions.reportUIPerformance(
      startTime3,
      endTime3,
      'AddCustomTokenScreen',
      1,
      3
    )
    await ManageTokensPage.inputCustomToken()
    await ManageTokensPage.tapAddButton()
    await ManageTokensPage.tapAddcustomToken()
    await ManageTokensPage.inputCustomToken()

    await Assert.isVisible(ManageTokensPage.addedMessage)
  })
})
