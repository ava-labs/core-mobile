import stakeScreenLoc from '../../locators/Stake/stakeScreen.loc'
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'
import { Platform } from '../../helpers/constants'
import commonElsPage from '../commonEls.page'
import delay from '../../helpers/waits'

type StakeCard = {
  title: string
  rewards: string
  amount: string
  time: string
}

class StakePage {
  get activeTab() {
    return by.text(stakeScreenLoc.activeTab)
  }

  get historyTab() {
    return by.text(stakeScreenLoc.historyTab)
  }

  get amountStakedText() {
    return by.text(stakeScreenLoc.amountStakedText)
  }

  get earnedRewardsText() {
    return by.text(stakeScreenLoc.earnedRewardsText)
  }

  get endDateText() {
    return by.text(stakeScreenLoc.endDateText)
  }

  get doneButtonText() {
    return by.text(stakeScreenLoc.doneButtonText)
  }

  get firstStakeText() {
    return by.text(stakeScreenLoc.firstStakeText)
  }

  get stakedAmountText() {
    return by.text(stakeScreenLoc.stakedAmountText)
  }

  get earnSvg() {
    return by.id(stakeScreenLoc.earnSvg)
  }

  get estimatedRewardsText() {
    return by.text(stakeScreenLoc.estimatedRewardsText)
  }

  get estimatedRewardsTooltip() {
    return by.id(stakeScreenLoc.estimatedRewardsTooltip)
  }

  get noActiveStakesTitle() {
    return by.text(stakeScreenLoc.noActiveStakesTitle)
  }

  get noActiveStakesDescription() {
    return by.text(stakeScreenLoc.noActiveStakesDescription)
  }

  get avaLogo() {
    return by.id(stakeScreenLoc.avaLogo)
  }

  get avaxText() {
    return by.text(stakeScreenLoc.avaxText)
  }

  get availableAvaxText() {
    return by.text(stakeScreenLoc.availableAvaxText)
  }

  get availableBalance() {
    return by.id(stakeScreenLoc.availableBalance)
  }

  get topBalanceItem() {
    return by.id(stakeScreenLoc.topBalanceItem)
  }

  get balanceTooltip() {
    return by.id(stakeScreenLoc.balanceTooltip)
  }

  get balanceTooltipText() {
    return by.text(stakeScreenLoc.balanceTooltipText)
  }

  get stakedAvaxText() {
    return by.text(stakeScreenLoc.stakedAvaxText)
  }

  get confirmationTitle() {
    return by.text(stakeScreenLoc.confirmationTitle)
  }

  get claimableAvaxText() {
    return by.text(stakeScreenLoc.claimableAvaxText)
  }

  get stakeTitle() {
    return by.text(stakeScreenLoc.stakeTitle)
  }

  get stakePrimaryButton() {
    return by.id(stakeScreenLoc.stakeButtonPrimary)
  }

  get stakeSecondaryButton() {
    return by.id(stakeScreenLoc.stakeButtonSecondary)
  }

  get stakeClaimButton() {
    return by.id(stakeScreenLoc.stakeClaimButton)
  }

  get stakingAmountTitle() {
    return by.text(stakeScreenLoc.stakingAmountTitle)
  }

  get stakingAmountDescription() {
    return by.text(stakeScreenLoc.stakingAmountDescription)
  }

  get stakeButtonText() {
    return by.text(stakeScreenLoc.stakeButtonText)
  }

  get stakeNow() {
    return by.id(stakeScreenLoc.stakeNow)
  }

  get cancel() {
    return by.id(stakeScreenLoc.cancel)
  }

  get cancelModal() {
    return by.id(stakeScreenLoc.cancelModal)
  }

  get notEnoughAvaxTitle() {
    return by.text(stakeScreenLoc.notEnoughAvaxTitle)
  }

  get notEnoughAvaxDescription() {
    return by.text(stakeScreenLoc.notEnoughAvaxDescription)
  }

  get notNowButton() {
    return by.id(stakeScreenLoc.notNowButton)
  }

  get newStakeTimeRemaining() {
    return by.text(stakeScreenLoc.newStakeTimeRemaining)
  }

  get timeRemaining() {
    return by.text(stakeScreenLoc.timeRemaining)
  }

  get nextButton() {
    return by.id(stakeScreenLoc.nextButton)
  }

  get inputAmount() {
    return by.id(stakeScreenLoc.inputAmount)
  }

  get swapAvaxButton() {
    return by.text(stakeScreenLoc.swapAvaxButton)
  }

  get recieveAvaxButton() {
    return by.text(stakeScreenLoc.recieveAvaxButton)
  }

  get buyAvaxButton() {
    return by.text(stakeScreenLoc.buyAvaxButton)
  }

  get switchNetworkTitle() {
    return by.text(stakeScreenLoc.switchNetworkTitle)
  }

  get switchNetworkDescription() {
    return by.text(stakeScreenLoc.switchNetworkDescription)
  }

  get switchNetworkButton() {
    return by.id(stakeScreenLoc.switchNetworkButton)
  }

  get switchNetworkButtonText() {
    return by.text(stakeScreenLoc.switchNetworkButtonText)
  }

  get usdText() {
    return by.text(stakeScreenLoc.usdText)
  }

  get tenpercentTextbutton() {
    return by.text(stakeScreenLoc.tenPercentText)
  }

  get twentyfivepercentTextbutton() {
    return by.text(stakeScreenLoc.twentyFivePercentText)
  }

  get fiftypercentTextbutton() {
    return by.text(stakeScreenLoc.fiftyPercentText)
  }

  get maxTextbutton() {
    return by.text(stakeScreenLoc.maxText)
  }

  get stakeCardTitle() {
    return by.id(stakeScreenLoc.stakeCardTitle)
  }

  get stakeDetailsTitle() {
    return by.id(stakeScreenLoc.stakeDetailsTitle)
  }

  get completedStatusChip() {
    return by.id(stakeScreenLoc.completedStatusChip)
  }

  get activeStatusChip() {
    return by.id(stakeScreenLoc.activeStatusChip)
  }

  get transactionIdText() {
    return by.text(stakeScreenLoc.transactionIdText)
  }

  get estimatedRewardsId() {
    return by.id(stakeScreenLoc.estimatedRewardsId)
  }

  get timeRemainingId() {
    return by.id(stakeScreenLoc.timeRemainingId)
  }

  get stakedAmountId() {
    return by.id(stakeScreenLoc.stakedAmountId)
  }

  get endDateId() {
    return by.id(stakeScreenLoc.endDateId)
  }

  get earnedRewardsId() {
    return by.id(stakeScreenLoc.earnedRewardsId)
  }

  get stakingSuccessful() {
    return by.text(stakeScreenLoc.stakingSuccessful)
  }

  get customRadio() {
    return by.text(stakeScreenLoc.customRadio)
  }

  get customFeeInput() {
    return by.id(stakeScreenLoc.customInput)
  }

  get customSaveBtn() {
    return by.id(stakeScreenLoc.customSaveBtn)
  }

  get slowBaseFee() {
    return by.id(stakeScreenLoc.slowBaseFee)
  }

  get fastBaseFee() {
    return by.id(stakeScreenLoc.fastBaseFee)
  }

  get instantBaseFee() {
    return by.id(stakeScreenLoc.instantBaseFee)
  }

  get customBaseFee() {
    return by.id(stakeScreenLoc.customBaseFee)
  }

  get durationScreenTitle() {
    return by.text(stakeScreenLoc.durationScreenTitle)
  }

  get claimableBalance() {
    return by.id(stakeScreenLoc.claimableBalance)
  }

  async tapActiveTab() {
    await Actions.tap(this.activeTab)
  }

  async tapHistoryTab() {
    await Actions.tap(this.historyTab)
  }

  async verifyStakeScreenItems() {
    await Assert.isVisible(this.stakeTitle)
    await Assert.isVisible(this.notEnoughAvaxTitle)
    await Assert.isVisible(this.recieveAvaxButton)
    if (Actions.platform() === Platform.Android) {
      await Assert.isVisible(this.swapAvaxButton)
      await Assert.isVisible(this.buyAvaxButton)
    }
  }

  async verifySwitchNetworkScreenItems() {
    await Assert.isVisible(this.switchNetworkTitle)
    await Assert.isVisible(this.switchNetworkDescription)
    await Assert.isVisible(this.switchNetworkButton)
    await Assert.isVisible(this.switchNetworkButtonText)
  }

  async tapSwitchNetworkButton() {
    await Actions.tap(this.switchNetworkButton)
  }

  async tapBalanceTooltip() {
    await Actions.tapElementAtIndex(this.balanceTooltip, 0)
  }

  async tapStakeButton() {
    try {
      await Actions.waitForElement(this.stakePrimaryButton, 3000)
      await Actions.tapElementAtIndex(this.stakePrimaryButton, 0)
    } catch {
      await Actions.waitForElement(this.stakeSecondaryButton, 3000)
      await Actions.tapElementAtIndex(this.stakeSecondaryButton, 0)
    }
  }

  async tapStakeNow() {
    await Actions.waitForElement(this.stakeNow, 5000)
    await Actions.tapElementAtIndex(this.stakeNow, 0)
  }

  async tapCancel() {
    await Actions.tapElementAtIndex(this.cancel, 0)
  }

  async tapCancelModal() {
    await Actions.tapElementAtIndex(this.cancelModal, 0)
  }

  async tapNextButton() {
    await Actions.tapElementAtIndex(this.nextButton, 0)
  }

  async tapNotNowButton() {
    await Actions.waitForElement(this.notNowButton)
    await Actions.tapElementAtIndex(this.notNowButton, 0)
  }

  async inputStakingAmount(amount: string) {
    await Actions.setInputText(this.inputAmount, amount + '\n')
  }

  async verifyStakeTopItems() {
    await Assert.isVisible(this.availableAvaxText)
    await Assert.isVisible(this.stakedAvaxText)
    await Assert.isVisible(this.claimableAvaxText)
    await Assert.isVisible(this.stakeButtonText, 1)
    await Assert.isVisible(this.avaLogo)
    if ((await Actions.isVisible(this.stakeSecondaryButton, 0)) === false) {
      await Assert.isVisible(this.stakePrimaryButton)
    } else {
      await Assert.isVisible(this.stakeSecondaryButton)
    }
  }

  async verifyStakingAmountScreenItems() {
    const availableBalance = await Actions.balanceToNumber(
      this.availableBalance
    )
    await Assert.isVisible(this.stakingAmountTitle)
    await Assert.isVisible(this.stakingAmountDescription)
    await Assert.isVisible(this.avaLogo)
    await Assert.isVisible(this.avaxText)
    await Assert.isVisible(this.inputAmount)
    await Assert.isVisible(this.balanceTooltip)
    if (availableBalance >= 250) {
      await Assert.isVisible(this.tenpercentTextbutton)
    } else if (availableBalance >= 100) {
      await Assert.isVisible(this.twentyfivepercentTextbutton)
    } else if (availableBalance >= 50) {
      await Assert.isVisible(this.fiftypercentTextbutton)
    }
    await Assert.isVisible(this.maxTextbutton)
  }

  async getTopBalance(balanceItem: string) {
    if (Actions.platform() === 'ios') {
      return null
    }
    let index
    switch (balanceItem) {
      case 'staked':
        index = 1
        break
      case 'claimable':
        index = 2
        break
      default:
        index = 0
    }
    const availableBalance = await Actions.balanceToNumber(
      this.topBalanceItem,
      index
    )
    console.log('availableBalance: ', availableBalance)
    return availableBalance
  }

  async tapStakeCard() {
    await Actions.tapElementAtIndex(this.stakeCardTitle, 0)
  }

  async verifyHistoryTabItems() {
    await Actions.waitForElement(this.stakeCardTitle, 10000)
    await Assert.isVisible(this.amountStakedText)
    await Assert.isVisible(this.earnedRewardsText)
    await Assert.isVisible(this.endDateText)
    await Assert.isVisible(this.completedStatusChip)
    await Assert.hasPartialText(this.stakeCardTitle, 'Stake #')
    await Assert.isVisible(this.endDateId)
    await Assert.isVisible(this.earnedRewardsId)
    await Assert.isVisible(this.stakedAmountId)
  }

  async verifyActiveStakeDetails(stakeCardInfo: StakeCard) {
    // Verify the stake detail static text
    await Actions.waitForElement(this.stakeDetailsTitle, 10000)
    await Assert.isVisible(this.stakedAmountText)
    await Assert.isVisible(this.estimatedRewardsText)
    await Assert.isVisible(this.estimatedRewardsTooltip)
    await Assert.isVisible(this.activeStatusChip)
    // Verify the active stake detail data
    const { title, rewards, amount, time } = stakeCardInfo
    await Assert.isVisible(by.text(title))
    await Assert.isVisible(by.text(rewards))
    await Assert.isVisible(by.text(amount))
    await Assert.isVisible(by.text(time))
  }

  async verifyCompletedStakeDetails(stakeCardInfo: StakeCard) {
    // Verify the stake detail static text
    await Actions.waitForElement(this.stakeDetailsTitle, 10000)
    await Assert.isVisible(this.stakedAmountText)
    await Assert.isVisible(this.earnedRewardsText)
    await Assert.isVisible(this.transactionIdText)
    await Assert.isVisible(this.endDateText)
    await Assert.isVisible(this.completedStatusChip)

    // Verify the completed stake detail data
    const { title, rewards, amount, time } = stakeCardInfo
    await Assert.isVisible(by.text(title))
    await Assert.isVisible(by.text(rewards))
    await Assert.isVisible(by.text(amount))
    await Assert.isVisible(by.text(time))
  }

  async verifyActiveTabItems() {
    await Actions.waitForElement(this.stakeCardTitle, 10000)
    await Assert.isVisible(this.stakedAmountText)
    await Assert.isVisible(this.estimatedRewardsText)
    await Assert.isVisible(this.estimatedRewardsTooltip)
    await Assert.hasPartialText(this.stakeCardTitle, 'Stake #')
    await Assert.isNotVisible(this.completedStatusChip)
    await Assert.isNotVisible(this.activeStatusChip)
    await Assert.isVisible(this.timeRemainingId)
    await Assert.isVisible(this.estimatedRewardsId)
    await Assert.isVisible(this.stakedAmountId)
  }

  async verifyNoActiveStakesScreenItems() {
    await Assert.isVisible(this.noActiveStakesTitle)
    await Assert.isVisible(this.noActiveStakesDescription)
    await Assert.isVisible(this.earnSvg)
  }

  async getStakeCardInfo(isActive = true): Promise<StakeCard> {
    const rewardsId = isActive ? this.estimatedRewardsId : this.earnedRewardsId
    const title = await Actions.getElementText(this.stakeCardTitle)
    const timeId = isActive ? this.timeRemainingId : this.endDateId
    const rewards = await Actions.getElementText(rewardsId)
    const stakedAmount = await Actions.getElementText(this.stakedAmountId)
    let time = await Actions.getElementText(timeId)
    if (isActive) {
      // We need to adjust the text a little bit
      time = time?.replace(' remaining', '') // remove `remaining` from `1 day remaining`
      time = time?.replace(/\b\w/g, char => char.toUpperCase()) // make it TitleCase `2 months 1 day` -> `2 Months 1 Day`
    }
    console.log(
      `Title: ${title}, Time: ${time}, Rewards: ${rewards}, Staked Amount: ${stakedAmount}`
    )
    return {
      title: title ?? '',
      rewards: rewards ?? '',
      amount: stakedAmount ?? '',
      time: time ?? ''
    }
  }

  async stake(amount: string, duration: string, custom = false) {
    await this.tapStakeButton()
    await this.tapNextButton()
    await this.inputStakingAmount(amount)
    await this.tapNextButton()
    await Actions.waitForElement(this.durationScreenTitle, 30000)
    if (custom) {
      await Actions.tap(this.customRadio)
      await Actions.tap(commonElsPage.calendarSVG)
      const datePicker = element(commonElsPage.datePicker)
      duration = new Date(
        new Date().setFullYear(new Date().getFullYear() + 2)
      ).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      await datePicker.setDatePickerDate(duration, 'MMMM dd, yyyy')
      if (Actions.platform() === Platform.Android) {
        await Actions.tap(commonElsPage.okBtn)
      } else {
        await Actions.tapAtXAndY(commonElsPage.datePicker, 0, -20)
      }
    } else {
      await Actions.tap(by.text(duration))
    }
    await this.tapNextButton()
    await Actions.waitForElement(this.stakeNow, 30000)
    await this.tapStakeNow()
  }

  async verifyStakeSuccessToast() {
    await Actions.waitForElement(this.stakingSuccessful, 60000, 0)
    await delay(5000)
  }
}

export default new StakePage()
