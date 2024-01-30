import { expect as jestExpect } from 'expect'
import Actions from '../../helpers/actions'
import Assert from '../../helpers/assertions'
import AdvancedPage from '../../pages/burgerMenu/advanced.page'
import { Platform } from '../../helpers/constants'
import LoginRecoverWallet from '../../helpers/loginRecoverWallet'
import BottomTabsPage from '../../pages/bottomTabs.page'
import { warmup } from '../../helpers/warmup'
import StakePage from '../../pages/Stake/stake.page'
import ClaimPage from '../../pages/Stake/claim.page'
import accountManagePage from '../../pages/accountManage.page'

const platformIndex = Actions.platform() === Platform.iOS ? 1 : 2

describe('Stake: testnet flow', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    await AdvancedPage.switchToMainnet()
  })

  it('should claim & verify claim screen items on testnet', async () => {
    await LoginRecoverWallet.recoverWalletLogin()
    await accountManagePage.switchToFirstAccount()
    await BottomTabsPage.tapPortfolioTab()
    await AdvancedPage.switchToTestnet()
    await BottomTabsPage.tapStakeTab()
    if (
      (await Actions.isVisible(
        StakePage.stakeSecondaryButton,
        platformIndex
      )) === false
    ) {
      if (Actions.platform() === Platform.Android) {
        const zeroClaimableBalance = await StakePage.getTopBalance('claimable')
        jestExpect(zeroClaimableBalance).toBe(0)
      } else {
        return
      }
    } else {
      const claimableBalance = await StakePage.getTopBalance('claimable')
      await Actions.tapElementAtIndex(
        StakePage.stakeSecondaryButton,
        platformIndex
      )
      await ClaimPage.verifyClaimRewardsScreenItems(claimableBalance)
      await ClaimPage.tapClaimNowButton()
      await Actions.waitForElement(StakePage.stakePrimaryButton, 25000, 0)
      await Assert.isVisible(StakePage.stakePrimaryButton)
      if (Actions.platform() === Platform.Android) {
        const newClaimableBalance = await StakePage.getTopBalance('claimable')
        jestExpect(newClaimableBalance).toBe(0)
      }
    }
  })
})
