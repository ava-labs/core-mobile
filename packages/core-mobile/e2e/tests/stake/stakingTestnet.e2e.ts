import { expect as jestExpect } from 'expect'
import Actions from '../../helpers/actions'
import Assert from '../../helpers/assertions'
import AccountManagePage from '../../pages/accountManage.page'
import AdvancedPage from '../../pages/burgerMenu/advanced.page'
import BottomTabsPage from '../../pages/bottomTabs.page'
import { warmup } from '../../helpers/warmup'
import StakePage from '../../pages/Stake/stake.page'
import ClaimPage from '../../pages/Stake/claim.page'
import { cleanup } from '../../helpers/cleanup'

describe('Stake on Testnet', () => {
  beforeAll(async () => {
    await warmup()
    await AdvancedPage.switchToTestnet()
  })

  afterAll(async () => {
    await cleanup()
  })

  it('should stake one day', async () => {
    await BottomTabsPage.tapStakeTab()
    await StakePage.stake('1', '1 Day')
    await StakePage.verifyStakeSuccessToast()
  })

  it('should stake one month', async () => {
    await BottomTabsPage.tapStakeTab()
    await StakePage.stake('1', '1 Month')
    await StakePage.verifyStakeSuccessToast()
  })

  it('should stake three months', async () => {
    await BottomTabsPage.tapStakeTab()
    await StakePage.stake('1', '3 Months')
    await StakePage.verifyStakeSuccessToast()
  })

  it('should stake six months', async () => {
    await BottomTabsPage.tapStakeTab()
    await StakePage.stake('1', '6 Months')
    await StakePage.verifyStakeSuccessToast()
  })

  it('should stake one year', async () => {
    await BottomTabsPage.tapStakeTab()
    await StakePage.stake('1', '1 Year')
    await StakePage.verifyStakeSuccessToast()
  })

  it('should stake custom duration', async () => {
    await BottomTabsPage.tapStakeTab()
    const maximumDuration = new Date(
      new Date().setFullYear(new Date().getFullYear() + 2)
    ).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    await StakePage.stake('1', maximumDuration, true)
    await StakePage.verifyStakeSuccessToast()
  })

  it('should claim the testnet stake', async () => {
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

  it('should test a staking flow for a new account on testnet', async () => {
    await BottomTabsPage.tapPortfolioTab()
    await AccountManagePage.createNthAccountAndSwitchToNth(3)
    await BottomTabsPage.tapStakeTab()
    await StakePage.verifyNoActiveStakesScreenItems()
  })
})
