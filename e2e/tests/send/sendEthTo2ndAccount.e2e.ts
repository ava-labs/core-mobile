/* eslint-disable jest/expect-expect */
import AccountManagePage from '../../pages/accountManage.page'
import ActivityTabPage from '../../pages/activityTab.page'
import ActivityTabLoc from '../../locators/activityTab.loc'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import PortfolioPage from '../../pages/portfolio.page'
import SendPage from '../../pages/send.page'
import sendLoc from '../../locators/send.loc'
import { warmup } from '../../helpers/warmup'

describe('Send Eth to another account', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should send Eth to second account', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapNetworksDropdownETH()

    const secondAccountAddress = await AccountManagePage.createSecondAccount()
    await PortfolioPage.tapEthNetwork()
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
  })

  it('Should receive Eth on second account', async () => {
    await ActivityTabPage.tapHeaderBack()
    await ActivityTabPage.verifyIncomingTransaction(
      ActivityTabLoc.ethIncomingTransactionDetail
    )
  })
})
