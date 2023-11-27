import Actions from '../../helpers/actions'
import AccountManagePage from '../../pages/accountManage.page'
import AdvancedPage from '../../pages/burgerMenu/advanced.page'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BottomTabsPage from '../../pages/bottomTabs.page'
import { warmup } from '../../helpers/warmup'
import StakePage from '../../pages/Stake/stake.page'

describe('Stake: testnet flow', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should verify no active stakes screen', async () => {
    await LoginRecoverWallet.recoverWalletLogin()
    await BottomTabsPage.tapPortfolioTab()
    await AccountManagePage.createAccount(3)
    await AdvancedPage.switchToTestnet()
    await BottomTabsPage.tapStakeTab()
    await StakePage.verifyNoActiveStakesScreenItems()
  })

  it('should verify history staking items', async () => {
    await Actions.tapElementAtIndex(StakePage.historyTab, 0)
    await StakePage.verifyHistoryTabItems()
  })
})
