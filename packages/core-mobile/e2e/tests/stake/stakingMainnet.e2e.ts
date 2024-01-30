import Actions from '../../helpers/actions'
import ConfirmStakingPage from '../../pages/Stake/confirmStaking.page'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BottomTabsPage from '../../pages/bottomTabs.page'
import DurationPage from '../../pages/Stake/duration.page'
import { warmup } from '../../helpers/warmup'
import GetStartedScreenPage from '../../pages/Stake/getStartedScreen.page'
import StakePage from '../../pages/Stake/stake.page'
import accountManagePage from '../../pages/accountManage.page'

describe('Stake mainnet flow', () => {
  beforeAll(async () => {
    await warmup()
  })

  it('should verify staking amount screen items on mainnet', async () => {
    await LoginRecoverWallet.recoverWalletLogin()
    await accountManagePage.switchToFirstAccount()
    await BottomTabsPage.tapStakeTab()
    await StakePage.tapStakeButton()
    await GetStartedScreenPage.tapNextButton()
    await StakePage.verifyStakingAmountScreenItems()
    await StakePage.inputStakingAmount('25')
    await StakePage.tapNextButton()
  })

  it('should verify duration screen items on mainnet', async () => {
    await DurationPage.verifyDurationScreenItems(false)
    await StakePage.tapNextButton()
  })

  it('should verify confirm staking screen items on mainnet', async () => {
    await Actions.waitForElement(StakePage.avaLogo, 15000, 0)
    await ConfirmStakingPage.verifyConfirmStakingScreenItems()
  })
})
