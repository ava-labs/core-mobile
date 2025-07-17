/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Actions from '../../helpers/actions'
import PortfolioPage from '../../pages/portfolio.page'
import NetworksManagePage from '../../pages/networksManage.page'
import NetworksManageLoc from '../../locators/networksManage.loc'
import { warmup } from '../../helpers/warmup'
import commonElsPage from '../../pages/commonEls.page'
import portfolioLoc from '../../locators/portfolio.loc'
import { cleanup } from '../../helpers/cleanup'

describe('Network Details', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    await cleanup()
  })

  it('should verify C-Chain Network Details', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapNetworkInfo(portfolioLoc.avaxNetwork)
    await NetworksManagePage.verifyNetworkDetails({
      title: portfolioLoc.avaxNetwork,
      url: NetworksManageLoc.avaxRpcUrl,
      chainId: NetworksManageLoc.avaxChainID,
      tokenSymbol: NetworksManageLoc.avaxSymbol,
      tokenName: NetworksManageLoc.avaxTokenName,
      explorerUrl: NetworksManageLoc.avaxExplorerUrl
    })
    await commonElsPage.goBack()
  })

  it('should verify Ethereum Network Details', async () => {
    await NetworksManagePage.tapNetworkInfo(portfolioLoc.ethNetwork)
    await NetworksManagePage.verifyNetworkDetails({
      title: portfolioLoc.ethNetwork,
      url: NetworksManageLoc.ethRpcUrl,
      chainId: NetworksManageLoc.ethChainID,
      tokenSymbol: NetworksManageLoc.ethNetworkSymbol,
      tokenName: NetworksManageLoc.ethNetworkTokenName,
      explorerUrl: NetworksManageLoc.ethExplorerUrl
    })
  })

  it('should connect network via Network Details', async () => {
    await Actions.swipeUp(
      NetworksManagePage.networkTokenNameText,
      'fast',
      0.2,
      0
    )
    await NetworksManagePage.tapConnect()
    await PortfolioPage.verifyActiveNetwork(portfolioLoc.ethNetwork)
  })
})
