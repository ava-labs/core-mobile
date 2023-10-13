/* eslint-disable jest/expect-expect */
import LoginRecoverWallet from '../../../helpers/loginRecoverWallet'
import AccountManagePage from '../../../pages/accountManage.page'
import ActivityTabPage from '../../../pages/activityTab.page'
import ActivityTabLoc from '../../../locators/activityTab.loc'
import PortfolioPage from '../../../pages/portfolio.page'
import SendPage from '../../../pages/send.page'
import sendLoc from '../../../locators/send.loc'
import { warmup } from '../../../helpers/warmup'

describe('Send USDC to another account', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should send USDC to second account', async () => {
    const secondAccountAddress = await AccountManagePage.createSecondAccount()
    await SendPage.sendTokenTo2ndAccount(
      sendLoc.usdcToken,
      sendLoc.sendingAmount
    )
    await PortfolioPage.tapAvaxNetwork()
    await PortfolioPage.tapActivityTab()
    await ActivityTabPage.verifyOutgoingTransaction(
      5000,
      secondAccountAddress,
      ActivityTabLoc.usdcOutgoingTransactionDetail
    )
  })

  it('Should receive USDC on second account', async () => {
    await ActivityTabPage.tapHeaderBack()
    await ActivityTabPage.verifyIncomingTransaction(
      ActivityTabLoc.usdcIncomingTransactionDetail
    )
  })
})
