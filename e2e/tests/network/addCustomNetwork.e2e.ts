/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Assert from '../../helpers/assertions'
import actions from '../../helpers/actions'
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
      (await actions.isVisible(NetworksManagePage.inputTextField, 5)) === false
    ) {
      await NetworksManagePage.swipeUp()
    }
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
