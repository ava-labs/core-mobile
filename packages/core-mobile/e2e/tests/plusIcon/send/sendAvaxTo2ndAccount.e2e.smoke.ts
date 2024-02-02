import LoginRecoverWallet from '../../../helpers/loginRecoverWallet'
import AccountManagePage from '../../../pages/accountManage.page'
import ActivityTabPage from '../../../pages/activityTab.page'
import ActivityTabLoc from '../../../locators/activityTab.loc'
import PortfolioPage from '../../../pages/portfolio.page'
import SendPage from '../../../pages/send.page'
import sendLoc from '../../../locators/send.loc'
import { warmup } from '../../../helpers/warmup'

describe('Send Avax to another account', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should send AVAX to second account', async () => {
    await LoginRecoverWallet.recoverWalletLogin()
    const secondAccountAddress = await AccountManagePage.createSecondAccount()
    await AccountManagePage.tapFirstAccount()
    await AccountManagePage.tapFirstAccount()
    await SendPage.sendTokenTo2ndAccount(
      sendLoc.avaxToken,
      sendLoc.sendingAmount
    )
    await PortfolioPage.tapAvaxNetwork()
    await PortfolioPage.tapActivityTab()
    await ActivityTabPage.verifyOutgoingTransaction(
      5000,
      secondAccountAddress,
      ActivityTabLoc.avaxOutgoingTransactionDetail
    )
  })

  it('Should receive AVAX on second account', async () => {
    await ActivityTabPage.tapHeaderBack()
    await ActivityTabPage.verifyIncomingTransaction(
      ActivityTabLoc.avaxIncomingTransactionDetail
    )
  })
})
