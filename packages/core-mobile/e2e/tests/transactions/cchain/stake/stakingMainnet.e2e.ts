import Actions from '../../../../helpers/actions'
import ConfirmStakingPage from '../../../../pages/Stake/confirmStaking.page'
import BottomTabsPage from '../../../../pages/bottomTabs.page'
import DurationPage from '../../../../pages/Stake/duration.page'
import { warmup } from '../../../../helpers/warmup'
import GetStartedScreenPage from '../../../../pages/Stake/getStartedScreen.page'
import StakePage from '../../../../pages/Stake/stake.page'
import AccountManagePage from '../../../../pages/accountManage.page'
import commonElsPage from '../../../../pages/commonEls.page'
import settingsPage from '../../../../pages/settings.page'

describe('Stake on Mainnet', () => {
  beforeAll(async () => {
    await warmup()
    await settingsPage.switchToMainnet()
  })

  it('should verify stake tabs', async () => {
    await BottomTabsPage.tapStakeTab()
    try {
      await StakePage.verifyNoActiveStakesScreenItems()
    } catch (e) {
      await StakePage.verifyActiveTabItems()
    }
    await StakePage.tapHistoryTab()
    await StakePage.verifyHistoryTabItems()
  })

  it('should verify active stake details', async () => {
    await StakePage.tapActiveTab()
    if (await Actions.isVisible(StakePage.stakeCardTitle, 0)) {
      // Verify active stake details if there is one active stake card
      const stakeCardInfo = await StakePage.getStakeCardInfo()
      await StakePage.tapStakeCard()
      await StakePage.verifyActiveStakeDetails(stakeCardInfo)
      await commonElsPage.goBack()
    } else {
      console.log('There is no active stake card')
    }
  })

  it('should verify completed stake details', async () => {
    await StakePage.tapHistoryTab()
    const stakeCardInfo = await StakePage.getStakeCardInfo(false)
    await StakePage.tapStakeCard()
    await StakePage.verifyCompletedStakeDetails(stakeCardInfo)
    await commonElsPage.goBack()
  })

  it('should test a staking flow on mainnet for an existing account', async () => {
    await StakePage.tapStakeButton()
    await GetStartedScreenPage.tapNextButton()
    if (await Actions.isVisible(StakePage.notEnoughAvaxTitle, 0)) {
      await commonElsPage.goBack()
      await commonElsPage.goBack()
    } else {
      await StakePage.verifyStakingAmountScreenItems()
      await StakePage.inputStakingAmount('25')
      await StakePage.tapNextButton()
      await DurationPage.verifyDurationScreenItems(false)
      await StakePage.tapNextButton()
      await Actions.waitForElement(StakePage.avaLogo, 30000, 0)
      await ConfirmStakingPage.verifyConfirmStakingScreenItems()
      await StakePage.tapCancel()
      await StakePage.tapCancelModal()
    }
  })

  it('should test a staking flow for a new account', async () => {
    await BottomTabsPage.tapPortfolioTab()
    await AccountManagePage.tapAccountDropdownTitle()
    if (!(await Actions.isVisible(AccountManagePage.fourthAccount, 0))) {
      await AccountManagePage.createAccount(4)
    } else {
      await AccountManagePage.tapFourthAccount()
      await AccountManagePage.tapAccountDropdownTitle()
    }
    await BottomTabsPage.tapStakeTab()
    await Actions.waitForElement(GetStartedScreenPage.getStartedTitle)
    await GetStartedScreenPage.verifyGetStartedScreenItems()
    await GetStartedScreenPage.tapNextButton()
    await Actions.waitForElement(StakePage.notEnoughAvaxTitle)
    await StakePage.verifyStakeScreenItems()
    await commonElsPage.goBack()
  })

  it('should test the disclamer text on Stake', async () => {
    await GetStartedScreenPage.tapDisclaimerText()
    await GetStartedScreenPage.verifyDisclaimerScreenItems()
  })
})
