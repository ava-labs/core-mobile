import actions from '../../../helpers/actions'
import { cleanup } from '../../../helpers/cleanup'
import { warmup } from '../../../helpers/warmup'
import sendLoc from '../../../locators/send.loc'
import accountManagePage from '../../../pages/accountManage.page'
import bottomTabsPage from '../../../pages/bottomTabs.page'
import advancedPage from '../../../pages/burgerMenu/advanced.page'
import networksManagePage from '../../../pages/networksManage.page'
import portfolioPage from '../../../pages/portfolio.page'
import sendPage from '../../../pages/send.page'

describe('Bitcoin Transaction', () => {
  beforeAll(async () => {
    await warmup()
    await accountManagePage.createSecondAccount()
  })

  afterAll(async () => {
    await cleanup()
  })

  it('should send BTC', async () => {
    await bottomTabsPage.tapPortfolioTab()
    await portfolioPage.tapNetworksDropdown()
    await portfolioPage.tapNetworksDropdownBTC()
    await sendPage.sendTokenTo2ndAccount(
      sendLoc.btcToken,
      sendLoc.sendingAmount,
      false
    )
    await sendPage.verifySuccessToast()
  })

  it('Should send BTC on testnet', async () => {
    await bottomTabsPage.tapPortfolioTab()
    await advancedPage.switchToTestnet()
    await networksManagePage.switchToBitcoinTestNet()
    await actions.waitForElement(
      networksManagePage.bitcoinTestnetNetwork,
      60000
    )
    await sendPage.sendTokenTo2ndAccount(
      sendLoc.btcToken,
      sendLoc.sendingAmount,
      false
    )
    await sendPage.verifySuccessToast()
  }, 120000)
})
