/* eslint-disable jest/expect-expect */
import actions from '../../helpers/actions'
import AccountManagePage from '../../pages/accountManage.page'
import ActivityTabPage from '../../pages/activityTab.page'
import ActivityTabLoc from '../../locators/activityTab.loc'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import NetworksManagePage from '../../pages/networksManage.page'
import PortfolioPage from '../../pages/portfolio.page'
import SendPage from '../../pages/send.page'
import sendLoc from '../../locators/send.loc'
import { warmup } from '../../helpers/warmup'
import { Platform } from '../../helpers/constants'
import AdvancedPage from '../../pages/burgerMenu/advanced.page'

const platformIndex = actions.platform() === Platform.iOS ? 1 : 0

describe('Send Goerly Eth to another account', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should send Goerly Eth to second account', async () => {
    await AdvancedPage.switchToTestnet()
    await PortfolioPage.tapNetworksDropdown()
    if (
      (await actions.isVisible(PortfolioPage.manageNetworks, platformIndex)) ===
      false
    ) {
      await PortfolioPage.tapNetworksDropdown()
    }
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapNetworksTab()
    await NetworksManagePage.tapEthereumGoerliNetwork()

    const secondAccountAddress = await AccountManagePage.createSecondAccount()

    await PortfolioPage.tapActivityTab()
    await SendPage.sendTokenTo2ndAccount(
      sendLoc.ethToken,
      sendLoc.sendingAmount
    )
    await ActivityTabPage.verifyOutgoingTransaction(
      40000,
      secondAccountAddress,
      ActivityTabLoc.ethOutgoingTransactionDetail
    )
  }, 90000)

  it('Should receive Goerly Eth on second account', async () => {
    await ActivityTabPage.tapHeaderBack()
    await ActivityTabPage.verifyIncomingTransaction(
      ActivityTabLoc.ethIncomingTransactionDetail
    )
  }, 30000)
})
