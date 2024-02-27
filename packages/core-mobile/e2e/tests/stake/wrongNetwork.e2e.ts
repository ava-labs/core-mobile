import Actions from '../../helpers/actions'
import AccountManagePage from '../../pages/accountManage.page'
import BottomTabsPage from '../../pages/bottomTabs.page'
import { warmup } from '../../helpers/warmup'
import PortfolioPage from '../../pages/portfolio.page'
import StakePage from '../../pages/Stake/stake.page'
import networksManagePage from '../../pages/networksManage.page'
import commonElsPage from '../../pages/commonEls.page'

describe('Stake: wrong network', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    await commonElsPage.tapBackButton2()
    await networksManagePage.switchToAvalancheNetwork()
  })

  it('should verify wrong network screen for staking on mainnet', async () => {
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
