/* eslint-disable jest/expect-expect */
import Assert from '../../helpers/assertions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import NetworksManagePage from '../../pages/networksManage.page'
import PortfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'
import AdvancedPage from '../../pages/burgerMenu/advanced.page'

describe('Enable Testnet', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should verify Avax Network', async () => {
    await AdvancedPage.switchToTestnet()
    await PortfolioPage.tapAvaxNetwork()
    await Assert.isVisible(PortfolioPage.avaxNetwork)
  })

  it('Should verify Bitcoin & Eth Goerly Networks', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapNetworksTab()
    await NetworksManagePage.searchNetworks('Ethereum Goerli')
    await Assert.isVisible(NetworksManagePage.ethereumGoerlyNetwork)
    await NetworksManagePage.searchNetworks('Bitcoin Testnet')
    await Assert.isVisible(NetworksManagePage.bitcoinTestnet)
  })
})
