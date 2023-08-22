// import Actions from '../../helpers/actions'
import stakeScreenLoc from '../../locators/Stake/stakeScreen.loc'
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'
import { Platform } from '../../helpers/constants'

class StakePage {
  get avaLogo() {
    return by.id(stakeScreenLoc.avaLogo)
  }

  get availableAvaxText() {
    return by.text(stakeScreenLoc.availableAvaxText)
  }

  get balanceTooltip() {
    return by.id(stakeScreenLoc.balanceTooltip)
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
    if ((await Actions.isVisible(this.stakeSecondaryButton, 0)) === false) {
      await Actions.tapElementAtIndex(this.stakePrimaryButton, 0)
    } else {
      await Actions.tapElementAtIndex(this.stakeSecondaryButton, 0)
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
    await Actions.setInputText(this.inputAmount, amount)
    // if (Actions.platform() === Platform.Android){
    //   await this.tapBalanceTooltip()
    //   await this.tapBalanceTooltip()
    // } else {
    await Actions.tap(this.stakingAmountTitle)
    // }
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
}

export default new StakePage()
