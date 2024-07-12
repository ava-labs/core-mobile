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

describe('Stake: testnet flow', () => {
  beforeAll(async () => {
    await warmup()
  })

  afterAll(async () => {
    if (process.env.SEEDLESS_TEST === 'true') {
      await AdvancedPage.switchToMainnet()
    }
  })

  it('should verify staking amount screen items', async () => {
    await AdvancedPage.switchToTestnet()
    await BottomTabsPage.tapStakeTab()
    await StakePage.tapStakeButton()
    await GetStartedScreenPage.verifyGetStartedScreenItems()
    await GetStartedScreenPage.tapNextButton()
    await StakePage.verifyStakingAmountScreenItems()
    await StakePage.inputStakingAmount('1')
    await StakePage.tapNextButton()
  })

  it('should verify duration screen items on testnet', async () => {
    await DurationPage.verifyDurationScreenItems(true)
    await StakePage.tapNextButton()
  })

  it('should verify confirm staking screen items on testnet', async () => {
    await Actions.waitForElement(
      ConfirmStakingPage.confirmStakingTitle,
      25000,
      0
    )
    await ConfirmStakingPage.verifyConfirmStakingScreenItems()
  })

  it('should verify staking on testnet', async () => {
    await StakePage.tapStakeNow()
    await Actions.waitForElement(StakePage.notNowButton, 25000, 0)
    await StakePage.tapNotNowButton()
    await Actions.waitForElement(StakePage.newStakeTimeRemaining, 15000, 0)
    await Assert.isVisible(StakePage.newStakeTimeRemaining)
  })

  it('should verify active staking items', async () => {
    await StakePage.verifyActiveTabItems()
  })

  it('should verify no active stakes screen', async () => {
    await BottomTabsPage.tapPortfolioTab()
    await AccountManagePage.createNthAccountAndSwitchToNth(3)
    await BottomTabsPage.tapStakeTab()
    await StakePage.verifyNoActiveStakesScreenItems()
  })
})
