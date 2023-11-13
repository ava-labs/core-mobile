/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import PortfolioPage from '../../pages/portfolio.page'
import NetworksManagePage from '../../pages/networksManage.page'
import NetworksManageLoc from '../../locators/networksManage.loc'
import { warmup } from '../../helpers/warmup'

describe('Add custom network', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('should add custom network', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await Actions.waitForElement(PortfolioPage.manageNetworks)
    await PortfolioPage.tapManageNetworks()
    //Should Check manage Networks element for Favorites screen
    await NetworksManagePage.tapAddNetwork()
    await Actions.waitForElement(NetworksManagePage.networkRpcUrl)

    await NetworksManagePage.inputNetworkRpcUrl(
      NetworksManageLoc.arbCustomRpcUrl
    )
    await NetworksManagePage.inputNetworkName(
      NetworksManageLoc.arbWrongCustomNetworkName
    )
    await NetworksManagePage.inputChainId(NetworksManageLoc.arbCustomChainID)
    await NetworksManagePage.inputNativeTokenSymbol(
      NetworksManageLoc.arbCustomNativeTokenSymbol
    )
    if (
      (await Actions.isVisible(NetworksManagePage.inputTextField, 5)) === false
    ) {
      await NetworksManagePage.swipeUp()
    }
    await NetworksManagePage.inputExplorerUrl(
      NetworksManageLoc.arbCustomExplorerUrl
    )
    await NetworksManagePage.swipeUp()
    await NetworksManagePage.tapSaveButton()
    await NetworksManagePage.tapCustomTab()
    await Assert.isVisible(NetworksManagePage.arbWrongCustomNetworkName)
  })

  it('should edit custom network', async () => {
    await NetworksManagePage.tapNetworkInfo()
    await NetworksManagePage.tapDropdown()
    await NetworksManagePage.tapEditNetwork()
    await NetworksManagePage.inputNetworkName(
      NetworksManageLoc.arbCustomNetworkName
    )
    await NetworksManagePage.swipeUp()
    await NetworksManagePage.tapSaveButton()
    await NetworksManagePage.tapHeaderBack()
    await Assert.isVisible(NetworksManagePage.arbCustomNetwork)
  })

  it('should add custom network to favorites', async () => {
    await NetworksManagePage.addBtcNetwork()
    await NetworksManagePage.tapFavoritesTab()
    await Assert.isVisible(NetworksManagePage.arbCustomNetwork)
  })

  it('should change active network to custom', async () => {
    await NetworksManagePage.tapCustomTab()
    await NetworksManagePage.tapArbCustomNetwork()
    await Assert.isVisible(NetworksManagePage.arbCustomNetwork)
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
    await Assert.isNotVisible(NetworksManagePage.arbCustomNetwork)
  })
})
