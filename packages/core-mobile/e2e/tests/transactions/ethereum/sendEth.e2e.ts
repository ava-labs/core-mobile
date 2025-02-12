import { cleanup } from '../../../helpers/cleanup'
import { warmup } from '../../../helpers/warmup'
import sendLoc from '../../../locators/send.loc'
import accountManagePage from '../../../pages/accountManage.page'
import bottomTabsPage from '../../../pages/bottomTabs.page'
import advancedPage from '../../../pages/burgerMenu/advanced.page'
import networksManagePage from '../../../pages/networksManage.page'
import portfolioPage from '../../../pages/portfolio.page'
import sendPage from '../../../pages/send.page'

describe('Ethereum Transaction', () => {
  beforeAll(async () => {
    await warmup()
    await accountManagePage.createSecondAccount()
  })

  afterAll(async () => {
    await cleanup()
  })

  it('Should send Eth on MainNet', async () => {
    await bottomTabsPage.tapPortfolioTab()
    await portfolioPage.tapNetworksDropdown()
    await portfolioPage.tapNetworksDropdownETH()
    await sendPage.sendTokenTo2ndAccount(
      sendLoc.ethToken,
      sendLoc.sendingAmount,
      false
    )
    await sendPage.verifySuccessToast()
  })

  it('Should send Sepolia Eth on TestNet', async () => {
    await bottomTabsPage.tapPortfolioTab()
    await advancedPage.switchToTestnet()
    await networksManagePage.switchToEthereumSepoliaNetwork()
    await portfolioPage.verifyActiveNetwork('Ethereum Sepolia')
    await sendPage.sendTokenTo2ndAccount(
      sendLoc.ethToken,
      sendLoc.sendingAmount,
      false
    )
    await sendPage.verifySuccessToast()
  }, 120000)
})
