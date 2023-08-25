/* eslint-disable jest/expect-expect */

import Actions from '../../helpers/actions'
import Assert from '../../helpers/assertions'
import AdvancedPage from '../../pages/burgerMenu/advanced.page'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BottomTabsPage from '../../pages/bottomTabs.page'
import { warmup } from '../../helpers/warmup'
import GetStartedScreenPage from '../../pages/Stake/getStartedScreen.page'
import StakePage from '../../pages/Stake/stake.page'

describe('Add and edit accounts', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('should verify staking on testnet', async () => {
    await AdvancedPage.switchToTestnet()
    await BottomTabsPage.tapStakeTab()
    await StakePage.tapStakeButton()
    await GetStartedScreenPage.tapNextButton()
    // add staking Amount Screen Items test
    await StakePage.inputStakingAmount('2')
    await StakePage.tapNextButton()
    // add duration Screen Items test
    await StakePage.tapNextButton()
    // add verify searching message test
    // add confirmation Screen Items test
    await Actions.waitForElement(StakePage.avaLogo, 10000, 0)
    await StakePage.tapStakeNow()
    // add verify notifications message test
    await Actions.waitForElement(StakePage.notNowButton, 15000, 0)
    await StakePage.tapNotNowButton()
    await Actions.waitForElement(StakePage.newStakeTimeRemaining, 10000, 0)
    await Assert.isVisible(StakePage.newStakeTimeRemaining)
  })
})
