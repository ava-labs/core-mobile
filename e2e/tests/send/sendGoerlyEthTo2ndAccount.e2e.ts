/* eslint-disable jest/expect-expect */
import AccountManagePage from '../../pages/accountManage.page'
import ActivityTabPage from '../../pages/activityTab.page'
import ActivityTabLoc from '../../locators/activityTab.loc'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import NetworksManagePage from '../../pages/networksManage.page'
import PortfolioPage from '../../pages/portfolio.page'
import SendPage from '../../pages/send.page'
import sendLoc from '../../locators/send.loc'
import { warmup } from '../../helpers/warmup'
import AdvancedPage from '../../pages/burgerMenu/advanced.page'

describe('Send Goerly Eth to another account', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should send Goerly Eth to second account', async () => {
    await AdvancedPage.switchToTestnet()
    await NetworksManagePage.switchToEthereumGoerliNetwork()
    const secondAccountAddress = await AccountManagePage.createSecondAccount()
    await PortfolioPage.tapEthGoerlyNetwork()
    await PortfolioPage.tapActivityTab()
    await SendPage.sendTokenTo2ndAccount(
      sendLoc.ethToken,
      sendLoc.sendingAmount
    )
    await ActivityTabPage.verifyOutgoingTransaction(
      60000,
      secondAccountAddress,
      ActivityTabLoc.ethOutgoingTransactionDetail
    )
  }, 120000)

  it('Should receive Goerly Eth on second account', async () => {
    await ActivityTabPage.tapHeaderBack()
    await ActivityTabPage.verifyIncomingTransaction(
      ActivityTabLoc.ethIncomingTransactionDetail
    )
  }, 30000)
})
