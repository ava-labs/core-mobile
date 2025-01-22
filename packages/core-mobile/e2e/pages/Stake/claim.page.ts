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

  get claimNowBtnEnabled() {
    return by.id(claimScreenLoc.claimNowBtnEnabled)
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
    await Actions.waitForElement(this.claimNowBtnEnabled, 20000)
    await Actions.tap(this.claimButton)
  }

  async verifyClaimRewardsScreenItems(topClaimableBalance: string | undefined) {
    if (topClaimableBalance) {
      await Actions.waitForElement(by.text(topClaimableBalance))
    }
    await Assert.isVisible(this.avaLogo)
    await Assert.isVisible(this.claimRewardsTitle)
    await Assert.isVisible(this.claimableAmountText)
    await Assert.isVisible(this.networkFeeText)
    await Assert.isVisible(this.claimButton)
    await Assert.isVisible(this.claimableAvaxAmount)
    await Assert.isVisible(this.claimableBalanceCurrency)
    await Actions.waitForElement(this.networkFeeAmount, 50000)
    await Actions.waitForElement(this.networkFeeCurrency, 50000)
  }
}

export default new ClaimPage()
