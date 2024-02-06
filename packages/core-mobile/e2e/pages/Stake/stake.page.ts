import stakeScreenLoc from '../../locators/Stake/stakeScreen.loc'
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'
import { Platform } from '../../helpers/constants'

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

  async tapActiveTab() {
    await Actions.tap(this.activeTab)
  }

  async tapHistoryTab() {
    await Actions.tap(this.historyTab)
  }

  async verifyStakeScreenItems() {
    await Assert.isVisible(this.stakeTitle)
    await Assert.isVisible(this.notEnoughAvaxTitle)
    await Assert.isVisible(this.notEnoughAvaxDescription)
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
    if ((await Actions.isVisible(this.stakePrimaryButton, 0)) === true) {
      await Actions.tapElementAtIndex(this.stakePrimaryButton, 0)
    } else {
      let platformIndex = 0
      if (Actions.platform() === Platform.Android) {
        platformIndex = 1
      }
      await Actions.tapElementAtIndex(this.stakeSecondaryButton, platformIndex)
    }
  }

  async tapStakeNow() {
    await Actions.tapElementAtIndex(this.stakeNow, 0)
  }

  async tapNextButton() {
    await Actions.tapElementAtIndex(this.nextButton, 0)
  }

  async tapNotNowButton() {
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

  async verifyHistoryTabItems() {
    await Assert.isVisible(this.amountStakedText)
    await Assert.isVisible(this.earnedRewardsText)
    await Assert.isVisible(this.endDateText)
    await Assert.isVisible(this.firstStakeText)
    //Add more items with testID's (date, amount, rewards, icons)
  }

  async verifyActiveTabItems() {
    await Assert.isVisible(this.stakedAmountText)
    await Assert.isVisible(this.estimatedRewardsText)
    await Assert.isVisible(this.estimatedRewardsTooltip)
    await Assert.isVisible(this.firstStakeText)
    //Add more items with testID's (date, amount, rewards)
  }

  async verifyNoActiveStakesScreenItems() {
    await Assert.isVisible(this.noActiveStakesTitle)
    await Assert.isVisible(this.noActiveStakesDescription)
    await Assert.isVisible(this.earnSvg)
  }
}

export default new StakePage()
