import AccountManagePage from '../../../pages/accountManage.page'
import ActivityTabPage from '../../../pages/activityTab.page'
import ActivityTabLoc from '../../../locators/activityTab.loc'
import PortfolioPage from '../../../pages/portfolio.page'
import SendPage from '../../../pages/send.page'
import sendLoc from '../../../locators/send.loc'
import { warmup } from '../../../helpers/warmup'

describe('Send WETH to another account', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should send WETH to second account', async () => {
    await AccountManagePage.switchToFirstAccount()
    const secondAccountAddress = await AccountManagePage.createSecondAccount()
    // await AccountManagePage.tapFirstAccount()
    await SendPage.sendTokenTo2ndAccount(
      sendLoc.wethToken,
      sendLoc.sendingAmount
    )
    await PortfolioPage.tapAvaxNetwork()
    await PortfolioPage.tapActivityTab()
    await ActivityTabPage.verifyOutgoingTransaction(
      20000,
      secondAccountAddress,
      ActivityTabLoc.wethOutgoingTransactionDetail
    )
  })
})
