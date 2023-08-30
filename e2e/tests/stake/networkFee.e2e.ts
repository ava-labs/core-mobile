/* eslint-disable jest/expect-expect */

import Actions from '../../helpers/actions'
import Assert from '../../helpers/assertions'
// import AdvancedPage from '../../pages/burgerMenu/advanced.page'
import ConfirmStakingPage from '../../pages/Stake/confirmStaking.page'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BottomTabsPage from '../../pages/bottomTabs.page'
import DurationPage from '../../pages/Stake/duration.page'
import { warmup } from '../../helpers/warmup'
import GetStartedScreenPage from '../../pages/Stake/getStartedScreen.page'
import StakePage from '../../pages/Stake/stake.page'

describe('Add and edit accounts', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('should verify staking amount screen items on mainnet', async () => {
    await BottomTabsPage.tapStakeTab()
    await StakePage.tapStakeButton()
    await GetStartedScreenPage.tapNextButton()
    await StakePage.verifyStakingAmountScreenItems()
    await StakePage.inputStakingAmount('25')
    await Assert.isVisible(StakePage.nextButton)
    await StakePage.tapNextButton()
  })

  it('should verify duration screen items on mainnet', async () => {
    await DurationPage.verifyDurationScreenItems(false)
    await StakePage.tapNextButton()
  })

  it('should verify confirm staking screen items on mainnet', async () => {
    await Actions.waitForElement(StakePage.avaLogo, 15000, 0)
    await ConfirmStakingPage.verifyConfirmStakingScreenItems()
    // await StakePage.tapStakeNow()
    // await Actions.waitForElement(StakePage.notNowButton, 25000, 0)
    // await StakePage.tapNotNowButton()
    // await Actions.waitForElement(StakePage.newStakeTimeRemaining, 15000, 0)
    // await Assert.isVisible(StakePage.newStakeTimeRemaining)
  })
})
