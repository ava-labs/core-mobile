import accountManagePage from '../../../pages/accountManage.page'
import sendPage from '../../../pages/send.page'
import sendLoc from '../../../locators/send.loc'
import portfolioPage from '../../../pages/portfolio.page'
import { warmup } from '../../../helpers/warmup'
import bottomTabsPage from '../../../pages/bottomTabs.page'
import { cleanup } from '../../../helpers/cleanup'
import actions from '../../../helpers/actions'
import portfolioLoc from '../../../locators/portfolio.loc'
import browserPage from '../../../pages/browser.page'

describe('P-Chain Transaction', () => {
  beforeAll(async () => {
    await warmup()
    await accountManagePage.createSecondAccount()
    try {
      await browserPage.fundPChain()
    } catch (e) {
      console.log('Unable to fund P-Chain account')
    }
  })

  afterAll(async () => {
    await cleanup()
  })

  it('should send AVAX on P-Chain', async () => {
    await bottomTabsPage.tapPortfolioTab()
    await portfolioPage.tapNetworksDropdown()
    await portfolioPage.tapNetworksDropdownAVAX(
      portfolioPage.networksDropdownPChain
    )
    await actions.waitForElement(
      by.id(portfolioLoc.activeNetwork + portfolioLoc.avaxPNetwork)
    )
    const hasBalance = await sendPage.sendTokenTo2ndAccount(
      sendLoc.avaxToken,
      sendLoc.sendingAmount,
      false,
      true
    )
    await sendPage.verifySuccessToast(hasBalance)
  })
})
