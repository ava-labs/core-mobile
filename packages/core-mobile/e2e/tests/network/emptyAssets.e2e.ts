import Assert from '../../helpers/assertions'
import actions from '../../helpers/actions'
import PortfolioPage from '../../pages/portfolio.page'
import NetworksManagePage from '../../pages/networksManage.page'
import { warmup } from '../../helpers/warmup'
import { cleanup } from '../../helpers/cleanup'
import accountManagePage from '../../pages/accountManage.page'
import bottomTabsPage from '../../pages/bottomTabs.page'
import commonElsPage from '../../pages/commonEls.page'

describe('Empty Assets', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    await cleanup()
  })

  it('should check empty assets on custom Network', async () => {
    await accountManagePage.createNthAccountAndSwitchToNth(4)
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapNetworksTab()
    await NetworksManagePage.searchNetworks('Polygon')
    await NetworksManagePage.tapStarSvgByNetwork('Polygon')
    await commonElsPage.goBack()
    await bottomTabsPage.tapPortfolioTab()
    await PortfolioPage.tapNetworksDropdown()
    const platformIndex = actions.platform() === 'ios' ? 1 : 0
    await actions.tapElementAtIndex(
      by.id('network_dropdown__Polygon'),
      platformIndex
    )
    await PortfolioPage.tapPolygonNetwork()
    await Assert.isVisible(PortfolioPage.noAssetsHeader)
    await Assert.isVisible(PortfolioPage.noAssetsHeader)
    await Assert.isVisible(PortfolioPage.addAssetsMessage)
    await Assert.isVisible(PortfolioPage.addAssetsButton)
  })
})
