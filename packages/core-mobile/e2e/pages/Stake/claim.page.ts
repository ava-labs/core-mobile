import { expect as jestExpect } from 'expect'
import claimScreenLoc from '../../locators/Stake/claimScreen.loc'
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'

class ClaimPage {
  get avaLogo() {
    return by.id(claimScreenLoc.avaLogo)
  }

  get claimRewardsTitle() {
    return by.text(claimScreenLoc.claimRewardsTitle)
  }

  get claimButton() {
    return by.text(claimScreenLoc.claimNowButton)
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

  async verifyClaimRewardsScreenItems(topClaimableBalance: number | null) {
    if (Actions.platform() === 'android') {
      const claimableBalance = await Actions.balanceToNumber(
        this.claimableAvaxAmount
      )

      jestExpect(claimableBalance).toBe(topClaimableBalance)
    }
    await Assert.isVisible(this.avaLogo)
    await Assert.isVisible(this.claimRewardsTitle)
    await Assert.isVisible(this.claimableAmountText)
    await Assert.isVisible(this.networkFeeText)
    await Assert.isVisible(this.claimButton)
    await Assert.isVisible(this.claimableAvaxAmount)
    await Assert.isVisible(this.claimableBalanceCurrency)
    await Assert.isVisible(this.networkFeeAmount)
    await Assert.isVisible(this.networkFeeCurrency)
  }
}

export default new ClaimPage()
