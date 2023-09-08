/* eslint-disable jest/expect-expect */

import Actions from '../../helpers/actions'
import Assert from '../../helpers/assertions'
import AdvancedPage from '../../pages/burgerMenu/advanced.page'
import { Platform } from '../../helpers/constants'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BottomTabsPage from '../../pages/bottomTabs.page'
import { warmup } from '../../helpers/warmup'
import StakePage from '../../pages/Stake/stake.page'
import ClaimPage from '../../pages/Stake/claim.page'

const platformIndex = Actions.platform() === Platform.iOS ? 1 : 2

describe('Stake: testnet flow', () => {
  beforeAll(async () => {
    await warmup()
    await LoginRecoverWallet.recoverWalletLogin()
  })

  it('should claim & verify claim screen items on testnet', async () => {
    await BottomTabsPage.tapPortfolioTab()
    // await AccountManagePage.createAccount(2)
    await AdvancedPage.switchToTestnet()

    await BottomTabsPage.tapStakeTab()
    if (
      (await Actions.isVisible(
        StakePage.stakeSecondaryButton,
        platformIndex
      )) === false
    ) {
      return
    } else {
      const claimableBalance = await StakePage.getTopBalance('claimable')
      await Actions.tapElementAtIndex(
        StakePage.stakeSecondaryButton,
        platformIndex
      )
      await ClaimPage.verifyClaimRewardsScreenItems(claimableBalance)
      await ClaimPage.tapClaimNowButton()
      await Actions.waitForElement(StakePage.stakePrimaryButton, 25000, 0)
      Assert.isVisible(StakePage.stakePrimaryButton)
    }
  })
})
