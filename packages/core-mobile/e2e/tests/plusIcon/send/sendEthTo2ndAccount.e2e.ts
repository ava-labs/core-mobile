import AccountManagePage from '../../../pages/accountManage.page'
import ActivityTabPage from '../../../pages/activityTab.page'
import PortfolioPage from '../../../pages/portfolio.page'
import SendPage from '../../../pages/send.page'
import sendLoc from '../../../locators/send.loc'
import { warmup } from '../../../helpers/warmup'
import networksManagePage from '../../../pages/networksManage.page'
import commonElsPage from '../../../pages/commonEls.page'
import bottomTabsPage from '../../../pages/bottomTabs.page'

describe('Send Eth to another account', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    if (process.env.PLATFORM === 'android') {
      await commonElsPage.tapBackButton()
    } else {
      await bottomTabsPage.tapPortfolioTab()
    }
    await networksManagePage.switchToAvalancheNetwork()
  })

  it('Should send Eth to second account', async () => {
    await AccountManagePage.createSecondAccount()
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapNetworksDropdownETH()
    await SendPage.sendTokenTo2ndAccount(
      sendLoc.ethToken,
      sendLoc.sendingAmount
    )
    await PortfolioPage.tapEthNetwork()
    await PortfolioPage.tapActivityTab()
    const newRow = await ActivityTabPage.getLatestActivityRow()
    await ActivityTabPage.verifyActivityRow(newRow, 'Send')
  })

  it('Should receive Eth on second account', async () => {
    // Change default account to the 2nd.
    await AccountManagePage.tapAccountDropdownTitle()
    await AccountManagePage.tapSecondAccount()

    // verify receive event
    const newRow = await ActivityTabPage.getLatestActivityRow()
    await ActivityTabPage.verifyActivityRow(newRow, 'Receive')
  })
})
