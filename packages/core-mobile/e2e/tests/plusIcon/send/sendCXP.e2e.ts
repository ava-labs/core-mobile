import accountManagePage from '../../../pages/accountManage.page'
import sendPage from '../../../pages/send.page'
import sendLoc from '../../../locators/send.loc'
import portfolioPage from '../../../pages/portfolio.page'
import { warmup } from '../../../helpers/warmup'
import actions from '../../../helpers/actions'
import bottomTabsPage from '../../../pages/bottomTabs.page'
import { cleanup } from '../../../helpers/cleanup'

describe('Send AVAX', () => {
  beforeEach(async () => {
    await warmup()
  })

  afterAll(async () => {
    await cleanup()
  })

  it('should send AVAX on C-Chain', async () => {
    await accountManagePage.createSecondAccount()
    await sendPage.sendTokenTo2ndAccount(
      sendLoc.avaxToken,
      sendLoc.sendingAmount
    )
    await sendPage.verifySuccessToast()
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
