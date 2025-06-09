import { warmup } from '../../../../helpers/warmup'
import loc from '../../../../locators/send.loc'
import commonElsPage from '../../../../pages/commonEls.page'
import sendPage from '../../../../pages/send.page'
import settingsPage from '../../../../pages/settings.page'

describe('Send AVAX', () => {
  beforeAll(async () => {
    await warmup()
    await settingsPage.createNthAccount()
  })

  afterAll(async () => {
    await settingsPage.switchToAccount()
  })

  it('should send AVAX', async () => {
    await sendPage.send(loc.avaxToken, loc.sendingAmount)
    await commonElsPage.verifySuccessToast()
  })

  // it('should verify the AVAX transaction on activity tab', async () => {
  //   await portfolioPage.goToActivityTab()
  //   await activityTabPage.verifyExistingRow('Send', '-0.00001 AVAX')
  //   await accountManagePage.switchToSecondAccount()
  //   await activityTabPage.verifyExistingRow('Receive', '+0.00001 AVAX')
  // })
})
