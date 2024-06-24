import Assert from '../../helpers/assertions'
import actions from '../../helpers/actions'
import PortfolioPage from '../../pages/portfolio.page'
import NetworksManagePage from '../../pages/networksManage.page'
import { warmup } from '../../helpers/warmup'

describe('Empty Assets', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    await NetworksManagePage.switchToAvalancheNetwork()
  })

  it('should check empty assets on custom Network', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapNetworksTab()
    await NetworksManagePage.searchNetworks('Polygon')
    await NetworksManagePage.tapPolygonCustomNetwork()

    await PortfolioPage.tapPolygonNetwork()
    await actions.waitForElement(PortfolioPage.noAssetsHeader)
    await Assert.isVisible(PortfolioPage.noAssetsHeader)
    await Assert.isVisible(PortfolioPage.addAssetsMessage)
    await Assert.isVisible(PortfolioPage.addAssetsButton)
  })
})
