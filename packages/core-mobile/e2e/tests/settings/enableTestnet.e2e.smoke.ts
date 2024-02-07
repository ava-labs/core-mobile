import Assert from '../../helpers/assertions'
import NetworksManagePage from '../../pages/networksManage.page'
import PortfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'
import AdvancedPage from '../../pages/burgerMenu/advanced.page'
import commonElsPage from '../../pages/commonEls.page'
import actions from '../../helpers/actions'
import accountManagePage from '../../pages/accountManage.page'

describe('Enable Testnet', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    await commonElsPage.tapBackButton()
    if (actions.platform() === 'android') {
      await commonElsPage.tapDeviceBackButton()
    } else {
      await accountManagePage.tapCarrotSVG()
    }
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
    await Assert.isVisible(NetworksManagePage.ethereumSepoliaNetwork)
    await NetworksManagePage.searchNetworks('Bitcoin Testnet')
    await Assert.isVisible(NetworksManagePage.bitcoinTestnet)
  })
})
