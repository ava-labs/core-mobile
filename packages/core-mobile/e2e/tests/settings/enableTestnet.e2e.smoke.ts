import Assert from '../../helpers/assertions'
import NetworksManagePage from '../../pages/networksManage.page'
import PortfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'
import AdvancedPage from '../../pages/burgerMenu/advanced.page'
import commonElsPage from '../../pages/commonEls.page'
import bottomTabsPage from '../../pages/bottomTabs.page'

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
    await PortfolioPage.tapAvaxNetwork()
    await Assert.isVisible(PortfolioPage.avaxNetwork)
  })

  it('Should verify Bitcoin & Eth Sepolia Networks', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapNetworksTab()
    await NetworksManagePage.searchNetworks('Ethereum Sepolia')
    await Assert.count(NetworksManagePage.ethereumSepoliaNetwork, 2)
    await NetworksManagePage.searchNetworks('Bitcoin Testnet')
    await Assert.count(NetworksManagePage.bitcoinTestnetNetwork, 2)
  })
})
