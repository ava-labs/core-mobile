import Actions from '../../helpers/actions'
import AccountManagePage from '../../pages/accountManage.page'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BottomTabsPage from '../../pages/bottomTabs.page'
import { warmup } from '../../helpers/warmup'
import PortfolioPage from '../../pages/portfolio.page'
import StakePage from '../../pages/Stake/stake.page'

describe('Stake: wrong network', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should verify wrong network screen for staking on mainnet', async () => {
    await LoginRecoverWallet.recoverWalletLogin()
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapNetworksDropdownETH()
    await BottomTabsPage.tapStakeTab()
    await Actions.waitForElement(StakePage.switchNetworkTitle)
    await StakePage.verifySwitchNetworkScreenItems()
  })

  it('should verify switching on Avax network for staking', async () => {
    await StakePage.tapSwitchNetworkButton()
    await StakePage.verifyStakeTopItems()
  })

  it('should verify wrong network screen (no stakes mainnet)', async () => {
    await BottomTabsPage.tapPortfolioTab()
    await AccountManagePage.createAccount(4)
    await PortfolioPage.tapNetworksDropdown()
    await PortfolioPage.tapNetworksDropdownETH()
    await BottomTabsPage.tapStakeTab()
    await Actions.waitForElement(StakePage.switchNetworkTitle)
    await StakePage.verifySwitchNetworkScreenItems()
  })
})
