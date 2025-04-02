import { cleanup } from '../../../helpers/cleanup'
import { warmup } from '../../../helpers/warmup'
import sendLoc from '../../../locators/send.loc'
import accountManagePage from '../../../pages/accountManage.page'
import bottomTabsPage from '../../../pages/bottomTabs.page'
import advancedPage from '../../../pages/burgerMenu/advanced.page'
import networksManagePage from '../../../pages/networksManage.page'
import portfolioPage from '../../../pages/portfolio.page'
import sendPage from '../../../pages/send.page'

describe('Send ETH', () => {
  beforeAll(async () => {
    await warmup()
    await accountManagePage.createSecondAccount()
    await bottomTabsPage.tapPortfolioTab()
    await portfolioPage.tapNetworksDropdown()
    await portfolioPage.tapNetworksDropdownETH()
  })

  afterAll(async () => {
    await cleanup()
  })

  it('Should send ETH on MainNet', async () => {
    await sendPage.sendTokenTo2ndAccount(
      sendLoc.ethToken,
      sendLoc.sendingAmount,
      false
    )
    await sendPage.verifySuccessToast()
  })

  it('should send Wrapped Ether on MainNet', async () => {
    await sendPage.sendTokenTo2ndAccount(
      sendLoc.wrappedEthToken,
      sendLoc.sendingAmount,
      false
    )
    await sendPage.verifySuccessToast()
  })

  it('Should switch to Ethereum Sepolia on TestNet', async () => {
    await bottomTabsPage.tapPortfolioTab()
    await advancedPage.switchToTestnet()
    await networksManagePage.switchToEthereumSepoliaNetwork()
    await portfolioPage.verifyActiveNetwork('Ethereum Sepolia')
  }, 120000)

  it('Should send Sepolia Eth on TestNet', async () => {
    await sendPage.sendTokenTo2ndAccount(
      sendLoc.ethToken,
      sendLoc.sendingAmount,
      false
    )
    await sendPage.verifySuccessToast()
  })
})
