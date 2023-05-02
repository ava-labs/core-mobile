/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import PortfolioPage from '../../pages/portfolio.page'
import NetworksManagePage from '../../pages/networksManage.page'
import { warmup } from '../../helpers/warmup'

describe('Change Network', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('should add custom network', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapAddNetwork()
    await NetworksManagePage.inputNetworkRpcUrl()
    await NetworksManagePage.inputNetworkName()
    await NetworksManagePage.inputChainId()
    await NetworksManagePage.inputNativeTokenSymbol()
    if (
      (await Actions.isVisible(NetworksManagePage.inputTextField, 5)) === false
    ) {
      await NetworksManagePage.swipeUp()
    }
    await NetworksManagePage.inputExplorerUrl()
    await NetworksManagePage.swipeUp()
    await NetworksManagePage.tapSaveButton()
    await NetworksManagePage.tapCustomTab()
    await Assert.isVisible(NetworksManagePage.customNetwork)
  })

  it('should edit custom network', async () => {
    await NetworksManagePage.tapNetworkInfo()
    await NetworksManagePage.tapDropdown()
    await NetworksManagePage.tapEditNetwork()
    await NetworksManagePage.inputNewNetworkName()
    await NetworksManagePage.swipeUp()
    await NetworksManagePage.tapSaveButton()
    await NetworksManagePage.tapHeaderBack()
    await Assert.isVisible(NetworksManagePage.newCustomNetworkName)
  })

  it('should add custom network to favorites', async () => {
    await NetworksManagePage.addBtcNetwork()
    await NetworksManagePage.tapFavoritesTab()
    await Assert.isVisible(NetworksManagePage.newCustomNetworkName)
  })

  it('should change active network to custom', async () => {
    await NetworksManagePage.tapCustomTab()
    await NetworksManagePage.tapNewCustomNetwork()
    await Assert.isVisible(NetworksManagePage.newCustomNetworkName)
  })

  it('should view balances of custom network', async () => {
    await PortfolioPage.tapArbitrumNetwork()
    await Actions.waitForElement(
      NetworksManagePage.ethTokenOnCustomNetwork,
      60000
    )
    await Assert.isVisible(NetworksManagePage.ethTokenOnCustomNetwork)
  })

  it('should delete custom network', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapCustomTab()
    await NetworksManagePage.tapNetworkInfo()
    await NetworksManagePage.tapDropdown()
    await NetworksManagePage.tapDeleteNetwork()
    await NetworksManagePage.tapDeleteNetwork()
    await Assert.isNotVisible(NetworksManagePage.newCustomNetworkName)
  })
})
