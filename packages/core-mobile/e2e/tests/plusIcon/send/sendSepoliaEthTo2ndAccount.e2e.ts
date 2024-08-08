import AccountManagePage from '../../../pages/accountManage.page'
import ActivityTabPage from '../../../pages/activityTab.page'
import NetworksManagePage from '../../../pages/networksManage.page'
import PortfolioPage from '../../../pages/portfolio.page'
import SendPage from '../../../pages/send.page'
import sendLoc from '../../../locators/send.loc'
import { warmup } from '../../../helpers/warmup'
import AdvancedPage from '../../../pages/burgerMenu/advanced.page'
import Actions from '../../../helpers/actions'

describe('Send Sepolia Eth to another account', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should switch network to Ethereum Sepolia', async () => {
    await AccountManagePage.createSecondAccount()
    await AdvancedPage.switchToTestnet()
    await NetworksManagePage.switchToEthereumSepoliaNetwork()
    await Actions.waitForElement(
      NetworksManagePage.ethereumSepoliaNetwork,
      60000
    )
  }, 120000)

  it('Should send Sepolia Eth to second account', async () => {
    await SendPage.sendTokenTo2ndAccount(
      sendLoc.ethToken,
      sendLoc.sendingAmount
    )
    await SendPage.verifySuccessToast()
  })

  it('Should have the send row in activity tab', async () => {
    await PortfolioPage.goToActivityTab()
    const newRow = await ActivityTabPage.getLatestActivityRow()
    await ActivityTabPage.verifyActivityRow(newRow, 'Send')
  })

  it('Should have the receive row in activity tab', async () => {
    await AccountManagePage.switchToSecondAccount()
    const newRow = await ActivityTabPage.getLatestActivityRow()
    await ActivityTabPage.verifyActivityRow(newRow, 'Receive')
  }, 30000)
})
