import Actions from '../../helpers/actions'
import AdvancedPage from '../../pages/burgerMenu/advanced.page'
import BottomTabsPage from '../../pages/bottomTabs.page'
import { warmup } from '../../helpers/warmup'
import StakePage from '../../pages/Stake/stake.page'
import ClaimPage from '../../pages/Stake/claim.page'
import advancedPage from '../../pages/burgerMenu/advanced.page'

describe('Stake on Testnet', () => {
  beforeAll(async () => {
    await warmup()
    await AdvancedPage.switchToTestnet()
  })

  afterAll(async () => {
    await advancedPage.switchToMainnet()
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
    console.log('duration: ', duration)
    await BottomTabsPage.tapStakeTab()
    await StakePage.stake('1', duration)
    await StakePage.verifyStakeSuccessToast()
  })

  it('should claim the testnet stake', async () => {
    await BottomTabsPage.tapStakeTab()
    if (await Actions.isVisible(StakePage.stakeClaimButton, 0)) {
      const claimableBalance = await Actions.getElementText(
        StakePage.topBalanceItem,
        2
      )
      console.log(`Claimable amount: ${claimableBalance}`)
      await Actions.tap(StakePage.stakeClaimButton)
      await ClaimPage.verifyClaimRewardsScreenItems(claimableBalance)
      await ClaimPage.tapClaimNowButton()
    }
  })
})
