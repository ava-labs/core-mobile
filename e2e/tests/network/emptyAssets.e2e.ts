/* eslint-disable jest/expect-expect */
import Assert from '../../helpers/assertions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import PortfolioPage from '../../pages/portfolio.page'
import NetworksManagePage from '../../pages/networksManage.page'
import { warmup } from '../../helpers/warmup'

describe('Change Network', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('should check empty assets on custom Network', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapAddNetwork()
    await NetworksManagePage.inputNetworkRpcUrl()
    await NetworksManagePage.inputNetworkName()
    await NetworksManagePage.inputChainId()
    await NetworksManagePage.inputNativeTokenSymbol()
    await NetworksManagePage.inputExplorerUrl()
    await NetworksManagePage.swipeUp()
    await NetworksManagePage.tapSaveButton()
    await NetworksManagePage.tapCustomTab()
    await NetworksManagePage.tapCustomNetwork()

    await PortfolioPage.tapArbitrumNetwork()
    await Assert.isVisible(PortfolioPage.noAssetsHeader)
    await Assert.isVisible(PortfolioPage.addAssetsMessage)
    await Assert.isVisible(PortfolioPage.addAssetsButton)
  })
})
