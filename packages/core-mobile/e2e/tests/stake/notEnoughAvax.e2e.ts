import Actions from '../../helpers/actions'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BottomTabsPage from '../../pages/bottomTabs.page'
import AccountManagePage from '../../pages/accountManage.page'
import { warmup } from '../../helpers/warmup'
import GetStartedScreenPage from '../../pages/Stake/getStartedScreen.page'
import StakePage from '../../pages/Stake/stake.page'

describe('Stake: not enough Avax', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should verify not enough avax screen items on Mainnet', async () => {
    await LoginRecoverWallet.recoverWalletLogin()
    await AccountManagePage.createAccount(4)
    await BottomTabsPage.tapStakeTab()
    await GetStartedScreenPage.tapNextButton()
    await Actions.waitForElement(StakePage.notEnoughAvaxTitle)
    await StakePage.verifyStakeScreenItems()
  })
})
