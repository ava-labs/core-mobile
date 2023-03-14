/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { device } from 'detox'
import Assert from '../../helpers/assertions'
import WatchListPage from '../../pages/watchlist.page'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import PortfolioPage from '../../pages/portfolio.page'
import NetworksManagePage from '../../pages/networksManage.page'

describe('Change Network', () => {
  beforeAll(async () => {
    await device.launchApp()
    await Assert.isVisible(WatchListPage.walletSVG, 1)
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
