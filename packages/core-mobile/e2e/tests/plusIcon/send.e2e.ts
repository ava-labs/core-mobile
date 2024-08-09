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

  it('should send AVAX and verify the transaction', async () => {
    await AccountManagePage.createSecondAccount()
    await SendPage.sendTokenTo2ndAccount(
      sendLoc.avaxToken,
      sendLoc.sendingAmount
    )
    await SendPage.verifySuccessToast()
    await PortfolioPage.goToActivityTab()
    const newRow = await ActivityTabPage.getLatestActivityRow()
    await ActivityTabPage.verifyActivityRow(newRow, 'Send')
  })
})
