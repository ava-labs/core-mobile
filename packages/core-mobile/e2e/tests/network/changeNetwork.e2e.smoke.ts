/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Actions from '../../helpers/actions'
import PortfolioPage from '../../pages/portfolio.page'
import NetworksManagePage from '../../pages/networksManage.page'
import commonElsPage from '../../pages/commonEls.page'
import { warmup } from '../../helpers/warmup'
import portfolio from '../../locators/portfolio.loc'

describe('Change Network', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapNetworksTab()
    await NetworksManagePage.tapStarSvgByIndex(1)
    await commonElsPage.tapBackButton()
    await NetworksManagePage.switchToAvalancheNetwork()
  })

  it('should verify default active network and inactive networks', async () => {
    await PortfolioPage.verifyActiveNetwork(portfolio.avaxNetwork)
    await PortfolioPage.verifyInactiveNetworks([
      portfolio.avaxPNetwork,
      portfolio.avaxXNetwork,
      portfolio.btcNetwork,
      portfolio.ethNetwork
    ])
  })

  it('should verify changing Active network to ETH', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapNetworksDropdownETH()
    await Actions.waitForElement(PortfolioPage.ethNetwork)
    await PortfolioPage.verifyActiveNetwork(portfolio.ethNetwork)
  })

  it('should verify changing Active network to BTC', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapNetworksDropdownBTC()
    await Actions.waitForElement(PortfolioPage.btcNetwork)
    await PortfolioPage.verifyActiveNetwork(portfolio.btcNetwork)
  })

  it('should verify changing Active network to AVAX', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapNetworksDropdownAVAX()
    await PortfolioPage.verifyActiveNetwork(portfolio.avaxNetwork)
  })

  it('should remove BTC network from favorites', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.addBtcNetwork()
    await NetworksManagePage.tapHeaderBack()
    await PortfolioPage.verifyNetworkRemoved(portfolio.btcNetwork)
  })
})
