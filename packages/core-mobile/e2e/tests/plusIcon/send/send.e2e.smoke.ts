import { warmup } from '../../../helpers/warmup'
import sendLoc from '../../../locators/send.loc'
import accountManagePage from '../../../pages/accountManage.page'
import activityTabPage from '../../../pages/activityTab.page'
import portfolioPage from '../../../pages/portfolio.page'
import sendPage from '../../../pages/send.page'

describe('Send AVAX', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    await accountManagePage.switchToFirstAccount()
  })

  it('should send AVAX on C-Chain', async () => {
    await accountManagePage.createSecondAccount()
    await sendPage.sendTokenTo2ndAccount(
      sendLoc.avaxToken,
      sendLoc.sendingAmount
    )
    await sendPage.verifySuccessToast()
  })

  it('should verify the AVAX transaction on activity tab', async () => {
    await portfolioPage.goToActivityTab()
    const sendRow = await activityTabPage.getLatestActivityRow()
    await activityTabPage.verifyActivityRow(sendRow, 'Send')

    await accountManagePage.switchToSecondAccount()
    const receiveRow = await activityTabPage.getLatestActivityRow()
    await activityTabPage.verifyActivityRow(receiveRow, 'Receive')
  })
})
