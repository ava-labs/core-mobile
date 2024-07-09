import AccountManagePage from '../../../pages/accountManage.page'
import ActivityTabPage from '../../../pages/activityTab.page'
import PortfolioPage from '../../../pages/portfolio.page'
import SendPage from '../../../pages/send.page'
import sendLoc from '../../../locators/send.loc'
import { warmup } from '../../../helpers/warmup'
import commonElsPage from '../../../pages/commonEls.page'

describe('Send Avax to another account', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should send AVAX to second account', async () => {
    // Send token to 2nd account
    await AccountManagePage.createSecondAccount()
    await SendPage.sendTokenTo2ndAccount(
      sendLoc.avaxToken,
      sendLoc.sendingAmount
    )

    // Go to activity tap
    await PortfolioPage.goToActivityTab()

    // verify send event
    const newRow = await ActivityTabPage.getLatestActivityRow()
    await ActivityTabPage.verifyActivityRow(newRow, 'Send')
  })

  it('Should receive AVAX on second account', async () => {
    // Change default account to the 2nd.
    await commonElsPage.tapBackButton()
    await AccountManagePage.tapAccountDropdownTitle(0)
    await AccountManagePage.tapSecondAccount()

    // verify receive event
    await PortfolioPage.goToActivityTab()
    const newRow = await ActivityTabPage.getLatestActivityRow()
    await ActivityTabPage.verifyActivityRow(newRow, 'Receive')
  })
})
