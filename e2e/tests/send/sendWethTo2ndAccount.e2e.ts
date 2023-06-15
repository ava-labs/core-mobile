/* eslint-disable jest/expect-expect */
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import AccountManagePage from '../../pages/accountManage.page'
import ActivityTabPage from '../../pages/activityTab.page'
import ActivityTabLoc from '../../locators/activityTab.loc'
import PortfolioPage from '../../pages/portfolio.page'
import SendPage from '../../pages/send.page'
import sendLoc from '../../locators/send.loc'
import { warmup } from '../../helpers/warmup'

describe('Send WETH to another account', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should send WETH to second account', async () => {
    const secondAccountAddress = await AccountManagePage.createSecondAccount()
    await PortfolioPage.tapActivityTab()
    await SendPage.sendTokenTo2ndAccount(
      sendLoc.wethToken,
      sendLoc.sendingAmount
    )
    await ActivityTabPage.verifyOutgoingTransaction(
      20000,
      secondAccountAddress,
      ActivityTabLoc.wethOutgoingTransactionDetail
    )
  })

  it('Should receive WETH on second account', async () => {
    await ActivityTabPage.tapHeaderBack()
    await ActivityTabPage.verifyIncomingTransaction(
      ActivityTabLoc.wethIncomingTransactionDetail
    )
  })
})
