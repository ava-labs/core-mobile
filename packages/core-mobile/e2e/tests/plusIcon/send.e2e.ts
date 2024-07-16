import AccountManagePage from '../../pages/accountManage.page'
import SendPage from '../../pages/send.page'
import sendLoc from '../../locators/send.loc'
import ActivityTabPage from '../../pages/activityTab.page'
import PortfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'

describe('Send AVAX', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should successfully navigate to send and review screen', async () => {
    // create second account to send AVAX
    await AccountManagePage.createSecondAccount()

    // Get the existing transactions rows
    await PortfolioPage.tapAvaxNetwork()
    await PortfolioPage.tapActivityTab()

    // Send token to the 2nd account
    await SendPage.sendTokenTo2ndAccount(
      sendLoc.avaxToken,
      sendLoc.sendingAmount
    )

    // Verify the new Send row is added on activity tab
    const newRow = await ActivityTabPage.getLatestActivityRow()
    await ActivityTabPage.verifyActivityRow(newRow, 'Send')

    // Verify you left app but in web browser
    await ActivityTabPage.verifyTransactionDetailWebBrowser('Send')
  })
})
