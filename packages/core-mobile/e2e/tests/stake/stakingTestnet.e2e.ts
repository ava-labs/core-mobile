import Actions from '../../helpers/actions'
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
  const duration = Actions.getRandomEle([
    '1 Day',
    '1 Month',
    '3 Months',
    '6 Months',
    '1 Year',
    'Custom'
  ])

  it(`should stake with random ${duration} duration`, async () => {
    const isCustom = duration === 'Custom' ? true : false
    console.log('duration: ', duration)
    await BottomTabsPage.tapStakeTab()
    await StakePage.stake('1', duration, isCustom)
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
      await Actions.waitForElementNotVisible(ClaimPage.claimButton, 10000)
    }
  })
})
