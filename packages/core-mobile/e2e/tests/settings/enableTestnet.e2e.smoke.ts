import Assert from '../../helpers/assertions'
import NetworksManagePage from '../../pages/networksManage.page'
import PortfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'
import AdvancedPage from '../../pages/burgerMenu/advanced.page'
import commonElsPage from '../../pages/commonEls.page'
import bottomTabsPage from '../../pages/bottomTabs.page'
import portfolioLoc from '../../locators/portfolio.loc'

describe('Enable Testnet', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    await commonElsPage.tapBackButton()
    await bottomTabsPage.tapPortfolioTab()
    await AdvancedPage.switchToMainnet()
  })

  it('Should verify Avax Network', async () => {
    await AdvancedPage.switchToTestnet()
    await PortfolioPage.verifyActiveNetwork(portfolioLoc.avaxNetwork)
  })

  it('Should verify Bitcoin Testnet Network', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapNetworksTab()
    await NetworksManagePage.searchNetworks('Bitcoin Testnet')
    await Assert.count(NetworksManagePage.bitcoinTestnetNetwork, 2)
  })

  it('Should verify Eth Sepolia Network', async () => {
    await NetworksManagePage.searchNetworks('Ethereum Sepolia')
    await Assert.count(NetworksManagePage.ethereumSepoliaNetwork, 2)
  })
})
