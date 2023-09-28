import confirmStakingLoc from '../../locators/Stake/confirmStaking.loc'
import Assert from '../../helpers/assertions'
class ConfirmStakingPage {
  get networkFee() {
    return by.id(confirmStakingLoc.networkFeeItem)
  }

  get confirmStakingTitle() {
    return by.text(confirmStakingLoc.confirmStakingTitle)
  }

  get confirmStakingDescription() {
    return by.text(confirmStakingLoc.confirmStakingDescription)
  }

  get avaLogo() {
    return by.id(confirmStakingLoc.avaLogo)
  }

  get estimatedRewardText() {
    return by.text(confirmStakingLoc.estimatedRewardText)
  }

  get stakedAmountText() {
    return by.text(confirmStakingLoc.stakedAmnountText)
  }

  get timeToUnlockText() {
    return by.text(confirmStakingLoc.timeToUnlockText)
  }

  get networkFeeText() {
    return by.text(confirmStakingLoc.networkFeeText)
  }

  get stakingFeeText() {
    return by.text(confirmStakingLoc.stakingFeeText)
  }

  async verifyConfirmStakingScreenItems() {
    await Assert.isVisible(this.networkFee)
    await Assert.isVisible(this.confirmStakingTitle)
    await Assert.isVisible(this.confirmStakingDescription)
    await Assert.isVisible(this.avaLogo)
    await Assert.isVisible(this.estimatedRewardText)
    await Assert.isVisible(this.stakedAmountText)
    await Assert.isVisible(this.timeToUnlockText)
    await Assert.isVisible(this.networkFeeText)
    await Assert.isVisible(this.stakingFeeText)
  }
}

export default new ConfirmStakingPage()
