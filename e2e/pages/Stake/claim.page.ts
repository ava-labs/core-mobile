import claimScreenLoc from '../../locators/Stake/claimScreen.loc'
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'

const jestExpect = require('expect')

class ClaimPage {
  get avaLogo() {
    return by.id(claimScreenLoc.avaLogo)
  }

  get claimRewardsTitle() {
    return by.text(claimScreenLoc.claimRewardsTitle)
  }

  get claimButton() {
    return by.id(claimScreenLoc.claimNowButton)
  }

  get claimableAmountText() {
    return by.text(claimScreenLoc.claimableAmountText)
  }

  get claimableAvaxAmount() {
    return by.id(claimScreenLoc.claimableAvaxAmount)
  }

  get claimableBalanceCurrency() {
    return by.id(claimScreenLoc.claimableBalanceCurrency)
  }

  get networkFeeAmount() {
    return by.id(claimScreenLoc.networkFeeAmount)
  }

  get networkFeeCurrency() {
    return by.id(claimScreenLoc.networkFeeCurrency)
  }

  get networkFeeText() {
    return by.text(claimScreenLoc.networkFeeText)
  }

  async tapClaimNowButton() {
    await Actions.tap(this.claimButton)
  }

  async verifyClaimRewardsScreenItems(topClaimableBalance: number) {
    const claimableBalance = await Actions.balanceToNumber(
      this.claimableAvaxAmount
    )
    await Assert.isVisible(this.avaLogo)
    await Assert.isVisible(this.claimRewardsTitle)
    await Assert.isVisible(this.claimableAmountText)
    await Assert.isVisible(this.networkFeeText)
    await Assert.isVisible(this.claimButton)
    await Assert.isVisible(this.claimableAvaxAmount)
    await Assert.isVisible(this.claimableBalanceCurrency)
    await Assert.isVisible(this.networkFeeAmount)
    await Assert.isVisible(this.networkFeeCurrency)
    jestExpect(claimableBalance).toBe(topClaimableBalance)
  }
}

export default new ClaimPage()
