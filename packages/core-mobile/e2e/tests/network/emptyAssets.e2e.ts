import Assert from '../../helpers/assertions'
import actions from '../../helpers/actions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import PortfolioPage from '../../pages/portfolio.page'
import NetworksManagePage from '../../pages/networksManage.page'
import NetworksManageLoc from '../../locators/networksManage.loc'
import { warmup } from '../../helpers/warmup'

describe('Empty Assets', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('should check empty assets on custom Network', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapAddNetwork()
    await NetworksManagePage.inputNetworkRpcUrl(
      NetworksManageLoc.polygonCustomRpcUrl
    )
    await NetworksManagePage.inputNetworkName(
      NetworksManageLoc.polygonCustomNetworkName
    )
    await NetworksManagePage.inputChainId(
      NetworksManageLoc.polygonCustomChainID
    )
    await NetworksManagePage.inputNativeTokenSymbol(
      NetworksManageLoc.polygonCustomNativeTokenSymbol
    )
    if (
      (await actions.isVisible(NetworksManagePage.inputTextField, 5)) === false
    ) {
      await NetworksManagePage.swipeUp()
    }
    await NetworksManagePage.inputExplorerUrl(
      NetworksManageLoc.polygonCustomExplorerUrl
    )
    await NetworksManagePage.swipeUp()
    await NetworksManagePage.tapSaveButton()
    await NetworksManagePage.tapCustomTab()
    await NetworksManagePage.tapPolygonCustomNetwork()

    await PortfolioPage.tapPolygonNetwork()
    await actions.waitForElement(PortfolioPage.noAssetsHeader)
    await Assert.isVisible(PortfolioPage.noAssetsHeader)
    await Assert.isVisible(PortfolioPage.addAssetsMessage)
    await Assert.isVisible(PortfolioPage.addAssetsButton)
  })
})
