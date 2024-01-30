import Assert from '../../helpers/assertions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import NetworksManagePage from '../../pages/networksManage.page'
import PortfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'
import AdvancedPage from '../../pages/burgerMenu/advanced.page'
import commonElsPage from '../../pages/commonEls.page'

describe('Enable Testnet', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    if (process.env.SEEDLESS_TEST === 'true') {
      await AdvancedPage.switchToMainnet()
    }
  })

  afterAll(async () => {
    await commonElsPage.tapBackButton()
    await AdvancedPage.switchToMainnet()
  })

  it('Should verify Avax Network', async () => {
    await LoginRecoverWallet.recoverWalletLogin()
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
