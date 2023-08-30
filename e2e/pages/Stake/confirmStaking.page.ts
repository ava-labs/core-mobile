import confirmStakingLoc from '../../locators/Stake/confirmStaking.loc'
import Assert from '../../helpers/assertions'

class ConfirmStakingPage {
  get networkFee() {
    return by.id(confirmStakingLoc.networkFeeItem)
  }

  async verifyConfirmStakingScreenItems() {
    await Assert.isVisible(this.networkFee)
  }
}

export default new ConfirmStakingPage()
