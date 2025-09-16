import { warmup } from '../../../../helpers/warmup'
import loc from '../../../../locators/send.loc'
import settingsLoc from '../../../../locators/settings.loc'
import bottomTabsPage from '../../../../pages/bottomTabs.page'
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

  it('should send ERC20', async () => {
    await sendPage.send(loc.coqInu, loc.sendingAmount)
    await commonElsPage.verifySuccessToast()
  })

  it('should verify the AVAX Sent history', async () => {
    // verify the first account tx history
    await bottomTabsPage.tapActivityTab()
    await portfolioPage.verifyActivityItem()
  })

  it('should verify the AVAX Received history', async () => {
    // verify the second account tx history
    await settingsPage.quickSwitchAccount(settingsLoc.account2)
    await bottomTabsPage.tapActivityTab()
    await portfolioPage.verifyActivityItem()
  })
})
