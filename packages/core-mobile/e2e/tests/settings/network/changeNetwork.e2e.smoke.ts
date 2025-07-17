/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
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
    await NetworksManagePage.switchToAvalancheNetwork()
  })

  it('should have C-chain as Active Network by default', async () => {
    await PortfolioPage.verifyActiveNetwork(portfolio.avaxNetwork)
  })

  it('should have Inactive Networks by default', async () => {
    await PortfolioPage.verifyInactiveNetworks([
      portfolio.avaxPNetwork,
      portfolio.avaxXNetwork,
      portfolio.btcNetwork,
      portfolio.ethNetwork
    ])
  })

  it('should set Ethereum as Active Network', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapNetworksDropdownETH()
    await PortfolioPage.verifyActiveNetwork(portfolio.ethNetwork)
  })

  it('should set Bitcoin as Active Network', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapNetworksDropdownBTC()
    await PortfolioPage.verifyActiveNetwork(portfolio.btcNetwork)
  })

  it('should set P-Chain as Active Network', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapNetworksDropdownAVAX(
      PortfolioPage.networksDropdownPChain
    )
    await PortfolioPage.verifyActiveNetwork(portfolio.avaxPNetwork)
  })

  it('should set X-Chain as Active Network', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapNetworksDropdownAVAX(
      PortfolioPage.networksDropdownXChain
    )
    await PortfolioPage.verifyActiveNetwork(portfolio.avaxXNetwork)
  })

  it('should add Arbitrum One to favorite networks', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapNetworksTab()
    await NetworksManagePage.tapStarSvgByNetwork(
      portfolio.arbitrumNetwork,
      false
    )
    await commonElsPage.goBack()
    await PortfolioPage.verifyInactiveNetworks([portfolio.arbitrumNetwork])
  })

  it('should remove Bitcoin from favorite networks', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapStarSvgByNetwork(portfolio.btcNetwork, false)
    await commonElsPage.goBack()
    await PortfolioPage.verifyNetworkRemoved(portfolio.btcNetwork)
  })
})
