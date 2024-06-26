import assert from 'assert'
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
    const currSendRows = await ActivityTabPage.getCurrentTransactionsRows(
      'Send'
    )

    // Send token to the 2nd account
    await SendPage.sendTokenTo2ndAccount(
      sendLoc.avaxToken,
      sendLoc.sendingAmount
    )

    // Verify the new row is added and compare the length with the existing rows length
    const newCurrSendRows = await ActivityTabPage.getCurrentTransactionsRows(
      'Send'
    )
    assert(
      currSendRows < newCurrSendRows,
      `currSendRows: ${currSendRows} !< newCurrSendRows: ${newCurrSendRows}`
    )

    // Verify you left app but in web browser
    await ActivityTabPage.verifyTransactionDetailWebBrowser()
  })
})
