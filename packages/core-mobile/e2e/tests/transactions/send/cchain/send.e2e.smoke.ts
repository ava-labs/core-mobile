import { warmup } from '../../../../helpers/warmup'
import loc from '../../../../locators/send.loc'
import settingsLoc from '../../../../locators/settings.loc'
import commonElsPage from '../../../../pages/commonEls.page'
import portfolioPage from '../../../../pages/portfolio.page'
import sendPage from '../../../../pages/send.page'
import settingsPage from '../../../../pages/settings.page'

describe('Send AVAX', () => {
  beforeAll(async () => {
    await warmup()
    await settingsPage.createNthAccount()
  })

  afterAll(async () => {
    await settingsPage.quickSwitchAccount()
  })

  it('should send AVAX', async () => {
    await sendPage.send(loc.avaxToken, loc.sendingAmount)
    await commonElsPage.verifySuccessToast()
  })

  it('should verify the AVAX Sent history', async () => {
    // verify the first account tx history
    await portfolioPage.filterNetwork()
    await portfolioPage.tapToken()
    await portfolioPage.verifyActivityItem()
    await commonElsPage.goBack()
  })

  it('should verify the AVAX Received history', async () => {
    // verify the second account tx history
    await settingsPage.quickSwitchAccount(settingsLoc.account2)
    await portfolioPage.tapToken()
    await portfolioPage.verifyActivityItem()
    await commonElsPage.goBack()
  })
})
