import { expect as jestExpect } from 'expect'
import Actions from '../../helpers/actions'
import Assert from '../../helpers/assertions'
import AccountManagePage from '../../pages/accountManage.page'
import AdvancedPage from '../../pages/burgerMenu/advanced.page'
import ConfirmStakingPage from '../../pages/Stake/confirmStaking.page'
import BottomTabsPage from '../../pages/bottomTabs.page'
import DurationPage from '../../pages/Stake/duration.page'
import { warmup } from '../../helpers/warmup'
import GetStartedScreenPage from '../../pages/Stake/getStartedScreen.page'
import StakePage from '../../pages/Stake/stake.page'
import ClaimPage from '../../pages/Stake/claim.page'
import { cleanup } from '../../helpers/cleanup'
import accountManagePage from '../../pages/accountManage.page'

describe('Stake on Testnet', () => {
  beforeAll(async () => {
    await warmup()
    await AdvancedPage.switchToTestnet()
  })

  afterAll(async () => {
    await cleanup()
  })

  it('should test a staking flow for a new account on testnet', async () => {
    await BottomTabsPage.tapPortfolioTab()
    await AccountManagePage.createNthAccountAndSwitchToNth(3)
    await BottomTabsPage.tapStakeTab()
    await StakePage.verifyNoActiveStakesScreenItems()
  })

  it('should test a staking flow on testnet for an existing account', async () => {
    await BottomTabsPage.tapPortfolioTab()
    await accountManagePage.switchToFirstAccount()
    await BottomTabsPage.tapStakeTab()
    await StakePage.tapStakeButton()
    await GetStartedScreenPage.verifyGetStartedScreenItems()
    await GetStartedScreenPage.tapNextButton()
    await StakePage.verifyStakingAmountScreenItems()
    await StakePage.inputStakingAmount('1')
    await StakePage.tapNextButton()
    await DurationPage.verifyDurationScreenItems(true)
    await StakePage.tapNextButton()
    await Actions.waitForElement(
      ConfirmStakingPage.confirmStakingTitle,
      30000,
      0
    )
    await ConfirmStakingPage.verifyConfirmStakingScreenItems()
  })

  it('should complete the stake on testnet', async () => {
    await StakePage.tapStakeNow()
    await Actions.waitForElement(StakePage.notNowButton, 60000, 0)
    await StakePage.tapNotNowButton()
    await Actions.waitForElement(StakePage.newStakeTimeRemaining, 15000, 0)
    await Assert.isVisible(StakePage.newStakeTimeRemaining)
    await StakePage.verifyActiveTabItems()
  })

  it('should claim the stake on testnet', async () => {
    await BottomTabsPage.tapPortfolioTab()
    await BottomTabsPage.tapStakeTab()
    if (await Actions.isVisible(StakePage.stakeClaimButton, 0)) {
      const claimableBalance = await StakePage.getTopBalance('claimable')
      await Actions.tap(StakePage.stakeClaimButton)
      await ClaimPage.verifyClaimRewardsScreenItems(claimableBalance)
      await ClaimPage.tapClaimNowButton()
      await Actions.waitForElement(StakePage.stakePrimaryButton, 25000, 0)
      await Assert.isVisible(StakePage.stakePrimaryButton)
      if (Actions.platform() === 'android') {
        const newClaimableBalance = await StakePage.getTopBalance('claimable')
        jestExpect(newClaimableBalance).toBe(0)
      }
    }
  })
})
