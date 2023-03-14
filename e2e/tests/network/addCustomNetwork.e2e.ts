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

  it('should add custom network', async () => {
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
    await Assert.isVisible(NetworksManagePage.customNetwork)
  })

  it('should add custom network to favorites', async () => {
    await NetworksManagePage.addBtcNetwork()
    await NetworksManagePage.tapFavoritesTab()
    await Assert.isVisible(NetworksManagePage.customNetwork)
  })

  it('should change active network to custom', async () => {
    await NetworksManagePage.tapCustomTab()
    await NetworksManagePage.tapCustomNetwork()
    await Assert.isVisible(NetworksManagePage.customNetwork)
  })

  it('should delete custom network', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapCustomTab()
    await NetworksManagePage.tapNetworkInfo()
    await NetworksManagePage.tapDropdown()
    await NetworksManagePage.tapDeleteNetwork()
    await NetworksManagePage.tapDeleteNetwork()
    await Assert.isNotVisible(NetworksManagePage.customNetwork)
  })
})
