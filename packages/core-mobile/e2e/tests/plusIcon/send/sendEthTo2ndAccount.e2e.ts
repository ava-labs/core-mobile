import AccountManagePage from '../../../pages/accountManage.page'
import ActivityTabPage from '../../../pages/activityTab.page'
import ActivityTabLoc from '../../../locators/activityTab.loc'
import PortfolioPage from '../../../pages/portfolio.page'
import SendPage from '../../../pages/send.page'
import sendLoc from '../../../locators/send.loc'
import { warmup } from '../../../helpers/warmup'
import networksManagePage from '../../../pages/networksManage.page'
import commonElsPage from '../../../pages/commonEls.page'

describe('Send Eth to another account', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    await commonElsPage.tapBackButton2()
    await networksManagePage.switchToAvalancheNetwork()
  })

  it('Should send Eth to second account', async () => {
    const secondAccountAddress = await AccountManagePage.createSecondAccount()
    await AccountManagePage.tapFirstAccount()
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapNetworksDropdownETH()
    await SendPage.sendTokenTo2ndAccount(
      sendLoc.ethToken,
      sendLoc.sendingAmount
    )
    await PortfolioPage.tapEthNetwork()
    await PortfolioPage.tapActivityTab()
    await ActivityTabPage.verifyOutgoingTransaction(
      60000,
      secondAccountAddress,
      ActivityTabLoc.ethOutgoingTransactionDetail
    )
  })

  it('Should receive Eth on second account', async () => {
    await ActivityTabPage.tapHeaderBack()
    await ActivityTabPage.verifyIncomingTransaction(
      ActivityTabLoc.ethIncomingTransactionDetail
    )
  })
})
