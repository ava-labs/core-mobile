/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Assert from '../../../helpers/assertions'
import Actions from '../../../helpers/actions'
import PortfolioPage from '../../../pages/portfolio.page'
import NetworksManagePage from '../../../pages/networksManage.page'
import NetworksManageLoc from '../../../locators/networksManage.loc'
import { warmup } from '../../../helpers/warmup'
import commonElsPage from '../../../pages/commonEls.page'
import accountManagePage from '../../../pages/accountManage.page'

describe('Add custom network', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    await Actions.waitForElementNotVisible(
      NetworksManagePage.networkNotAvailableToast,
      60000
    )
    await commonElsPage.tapBackButton()
    await NetworksManagePage.switchToAvalancheNetwork()
  })

  it('should add custom network', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapAddNetwork()
    await NetworksManagePage.inputNetworkRpcUrl(NetworksManageLoc.celoRpcUrl)
    await NetworksManagePage.inputNetworkName(
      NetworksManageLoc.celoWrongNetworkName
    )
    await NetworksManagePage.inputChainId(NetworksManageLoc.celoChainID)
    await NetworksManagePage.inputNativeTokenSymbol(
      NetworksManageLoc.celoNativeTokenSymbol
    )
    await NetworksManagePage.swipeUp()
    await NetworksManagePage.inputExplorerUrl(NetworksManageLoc.celoExplorerUrl)
    await Actions.dismissKeyboard(NetworksManageLoc.explorerUrl)
    await NetworksManagePage.tapSaveButton()
    await NetworksManagePage.tapCustomTab()
    await Assert.isVisible(NetworksManagePage.celoWrongNetworkName)
  })

  it('should edit custom network', async () => {
    await NetworksManagePage.tapNetworkInfo(
      NetworksManageLoc.celoWrongNetworkName
    )
    await NetworksManagePage.tapDropdown()
    await NetworksManagePage.tapEditNetwork()
    await NetworksManagePage.inputNetworkName(NetworksManageLoc.celoNetworkName)
    await NetworksManagePage.tapSaveButton()
    await Assert.isVisible(NetworksManagePage.celoNetworkName)
  })

  it('should switch to custom network', async () => {
    await NetworksManagePage.tapConnect()
    await PortfolioPage.verifyActiveNetwork(NetworksManageLoc.celoNetworkName)
  })

  it('should verify empty assets on custom network', async () => {
    await accountManagePage.createNthAccountAndSwitchToNth(4)
    await PortfolioPage.verifyActiveNetwork(NetworksManageLoc.celoNetworkName)
    await PortfolioPage.tapActiveNetwork(NetworksManageLoc.celoNetworkName)
    await Assert.isVisible(PortfolioPage.noAssetsHeader)
    await Assert.isVisible(PortfolioPage.noAssetsHeader)
    await Assert.isVisible(PortfolioPage.addAssetsMessage)
    await Assert.isVisible(PortfolioPage.addAssetsButton)
  })

  it('should delete custom network', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapCustomTab()
    await NetworksManagePage.tapNetworkInfo(NetworksManageLoc.celoNetworkName)
    await NetworksManagePage.tapDropdown()
    await NetworksManagePage.tapDeleteNetwork()
    await NetworksManagePage.tapDeleteNetwork()
    await Actions.waitForElementNotVisible(NetworksManagePage.celoNetworkName)
  })
})
