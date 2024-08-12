import accountManagePage from '../../../pages/accountManage.page'
import sendPage from '../../../pages/send.page'
import sendLoc from '../../../locators/send.loc'
import activityTabPage from '../../../pages/activityTab.page'
import portfolioPage from '../../../pages/portfolio.page'
import { warmup } from '../../../helpers/warmup'
import actions from '../../../helpers/actions'
import bottomTabsPage from '../../../pages/bottomTabs.page'
import networksManagePage from '../../../pages/networksManage.page'

describe('Send AVAX', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    await bottomTabsPage.tapPortfolioTab()
    await networksManagePage.switchToAvalancheNetwork()
  })

  it('should send AVAX on C-Chain', async () => {
    await accountManagePage.createSecondAccount()
    await sendPage.sendTokenTo2ndAccount(
      sendLoc.avaxToken,
      sendLoc.sendingAmount
    )
    await sendPage.verifySuccessToast()
    await portfolioPage.goToActivityTab()
    const newRow = await activityTabPage.getLatestActivityRow()
    await activityTabPage.verifyActivityRow(newRow, 'Send')
  })

  it('should send AVAX on P-Chain', async () => {
    await bottomTabsPage.tapPortfolioTab()
    await portfolioPage.tapNetworksDropdown()
    await portfolioPage.tapNetworksDropdownAVAX(
      portfolioPage.networksDropdownPChain
    )
    await actions.waitForElement(portfolioPage.avaxPNetwork)
    await sendPage.sendTokenTo2ndAccount(
      sendLoc.avaxToken,
      sendLoc.sendingAmount
    )
    await sendPage.verifySuccessToast()
  })

  it('should send AVAX on X-Chain', async () => {
    await bottomTabsPage.tapPortfolioTab()
    await portfolioPage.tapNetworksDropdown()
    await portfolioPage.tapNetworksDropdownAVAX(
      portfolioPage.networksDropdownXChain
    )
    await actions.waitForElement(portfolioPage.avaxXNetwork)
    await sendPage.sendTokenTo2ndAccount(
      sendLoc.avaxToken,
      sendLoc.sendingAmount
    )
    await sendPage.verifySuccessToast()
  })
})
