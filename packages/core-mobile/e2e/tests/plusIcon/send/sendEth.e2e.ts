import Actions from '../../../helpers/actions'
import { cleanup } from '../../../helpers/cleanup'
import { warmup } from '../../../helpers/warmup'
import sendLoc from '../../../locators/send.loc'
import accountManagePage from '../../../pages/accountManage.page'
import activityTabPage from '../../../pages/activityTab.page'
import bottomTabsPage from '../../../pages/bottomTabs.page'
import advancedPage from '../../../pages/burgerMenu/advanced.page'
import networksManagePage from '../../../pages/networksManage.page'
import portfolioPage from '../../../pages/portfolio.page'
import sendPage from '../../../pages/send.page'

describe('Send ETH', () => {
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
      sendLoc.sendingAmount
    )
    await sendPage.verifySuccessToast()
  })

  it('Should verify the ETH transaction on MainNet ', async () => {
    await portfolioPage.tapEthNetwork()
    await portfolioPage.tapActivityTab()
    await activityTabPage.verifyExistingRow('Send', '-0.000001 ETH')

    await accountManagePage.switchToSecondAccount()
    await activityTabPage.refreshActivityPage()
    await activityTabPage.verifyExistingRow('Receive', '+0.000001 ETH')
    await accountManagePage.switchToFirstAccount()
  })

  it('Should switch to Ethereum Sepolia on TestNet', async () => {
    await bottomTabsPage.tapPortfolioTab()
    await advancedPage.switchToTestnet()
    await networksManagePage.switchToEthereumSepoliaNetwork()
    await Actions.waitForElement(
      networksManagePage.ethereumSepoliaNetwork,
      60000
    )
  }, 120000)

  it('Should send Sepolia Eth on TestNet', async () => {
    await sendPage.sendTokenTo2ndAccount(
      sendLoc.ethToken,
      sendLoc.sendingAmount
    )
    await sendPage.verifySuccessToast()
  })

  it('Should verify the ETH transaction on TestNet ', async () => {
    await networksManagePage.tapEthereumSepoliaNetwork(1)
    await portfolioPage.tapActivityTab()
    await activityTabPage.verifyExistingRow('Send', '-0.000001 ETH')

    await accountManagePage.switchToSecondAccount()
    await activityTabPage.refreshActivityPage()
    await activityTabPage.verifyExistingRow('Receive', '+0.000001 ETH')
  })
})
