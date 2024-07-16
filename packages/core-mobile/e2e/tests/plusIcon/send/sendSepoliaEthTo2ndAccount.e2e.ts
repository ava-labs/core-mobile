import AccountManagePage from '../../../pages/accountManage.page'
import ActivityTabPage from '../../../pages/activityTab.page'
import NetworksManagePage from '../../../pages/networksManage.page'
import PortfolioPage from '../../../pages/portfolio.page'
import SendPage from '../../../pages/send.page'
import sendLoc from '../../../locators/send.loc'
import { warmup } from '../../../helpers/warmup'
import AdvancedPage from '../../../pages/burgerMenu/advanced.page'

describe('Send Sepolia Eth to another account', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('Should send Sepolia Eth to second account', async () => {
    await AccountManagePage.createSecondAccount()
    await AdvancedPage.switchToTestnet()
    await NetworksManagePage.switchToEthereumSepoliaNetwork()
    await SendPage.sendTokenTo2ndAccount(
      sendLoc.ethToken,
      sendLoc.sendingAmount
    )
    await PortfolioPage.tapEthSepoliaNetwork()
    await PortfolioPage.tapActivityTab()

    // TODO currently there is an issue with sending ethereum seplia in testnet on simul/emul
    // we can revisit once CP-8848 is fixed
    // we need to fix `await ActivityTabPage.verifyOutgoingTransaction() method to verify the transaction`
  }, 120000)

  it('Should receive Sepolia Eth on second account', async () => {
    // Change default account to the 2nd.
    await AccountManagePage.tapAccountDropdownTitle()
    await AccountManagePage.tapSecondAccount()

    // verify receive event
    const newRow = await ActivityTabPage.getLatestActivityRow()
    await ActivityTabPage.verifyActivityRow(newRow, 'Receive')
  }, 30000)
})
