import AccountManagePage from '../../pages/accountManage.page'
import SendPage from '../../pages/send.page'
import sendLoc from '../../locators/send.loc'
import ActivityTabPage from '../../pages/activityTab.page'
import ActivityTabLoc from '../../locators/activityTab.loc'
import PortfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'

describe('Send AVAX', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should successfully navigate to send and review screen', async () => {
    const secondAccountAddress = await AccountManagePage.createSecondAccount()
    await PortfolioPage.tapAvaxNetwork()
    await PortfolioPage.tapActivityTab()
    await SendPage.sendTokenTo2ndAccount(
      sendLoc.avaxToken,
      sendLoc.sendingAmount
    )
    await ActivityTabPage.verifyOutgoingTransaction(
      10000,
      secondAccountAddress,
      ActivityTabLoc.avaxOutgoingTransactionDetail
    )
  })
})
