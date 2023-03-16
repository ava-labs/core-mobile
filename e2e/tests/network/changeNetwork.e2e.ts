/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import { device } from 'detox'
import Assert from '../../helpers/assertions'
import WatchListPage from '../../pages/watchlist.page'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import PortfolioPage from '../../pages/portfolio.page'
import NetworksManagePage from '../../pages/networksManage.page'

describe('Change Network', () => {
  beforeAll(async () => {
    await device.launchApp()
    await Assert.isVisible(WatchListPage.walletSVG, 1)
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('should verify changing Active network to ETH', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapNetworksDropdownETH()
    await Assert.isVisible(PortfolioPage.ethNetwork)
  })

  it('should add BTC network to favorites', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapNetworksTab()
    await NetworksManagePage.addBtcNetwork()
    await NetworksManagePage.tapHeaderBack()
    await Assert.isVisible(PortfolioPage.networksDropdownBTC)
  })

  it('should verify changing Active network to BTC', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapNetworksDropdownBTC()
    await Assert.isVisible(PortfolioPage.btcNetwork)
  })

  it('should verify changing Active network to AVAX', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapNetworksDropdownETH()
    await Assert.isVisible(PortfolioPage.avaxNetwork)
  })

  it('should remove BTC network from favorites', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapNetworksTab()
    await NetworksManagePage.addBtcNetwork()
    await NetworksManagePage.tapHeaderBack()
    await PortfolioPage.tapNetworksDropdown()
    await Assert.isNotVisible(PortfolioPage.networksDropdownBTC)
  })
})
