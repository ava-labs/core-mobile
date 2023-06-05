/* eslint-disable jest/expect-expect */
/* eslint-env detox/detox, jest */
/**
 * @jest-environment ./environment.ts
 */
import Assert from '../../helpers/assertions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import NetworksManagePage from '../../pages/networksManage.page'
import BurgerMenuPage from '../../pages/burgerMenu/burgerMenu.page'
import PortfolioPage from '../../pages/portfolio.page'
import { warmup } from '../../helpers/warmup'

describe('Enable Testnet', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('Should verify Transaction Status Items', async () => {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapAdvanced()
    await BurgerMenuPage.switchToTestnet()
    await BurgerMenuPage.tapBackbutton()
    await BurgerMenuPage.swipeLeft()

    await PortfolioPage.tapAvaxNetwork()
    await Assert.isVisible(PortfolioPage.avaxFujiToken)
  })

  it('Should verify transaction succeeded', async () => {
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapManageNetworks()
    await NetworksManagePage.tapNetworksTab()
    await Assert.isVisible(NetworksManagePage.ethereumGoerlyNetwork)
    await Assert.isVisible(NetworksManagePage.bitcoinTestnet)
  })
})
