// import Actions from '../../helpers/actions'
import stakeScreenLoc from '../../locators/Stake/stakeScreen.loc'
import Assert from '../../helpers/assertions'
import Actions from '../../helpers/actions'

class StakePage {
  get avaLogo() {
    return by.id(stakeScreenLoc.avaLogo)
  }

  get availableAvaxText() {
    return by.text(stakeScreenLoc.availableAvaxText)
  }

  get stakedAvaxText() {
    return by.text(stakeScreenLoc.stakedAvaxText)
  }

  get claimableAvaxText() {
    return by.text(stakeScreenLoc.claimableAvaxText)
  }

  get stakeTitle() {
    return by.text(stakeScreenLoc.stakeTitle)
  }

  get stakeButton() {
    return by.id(stakeScreenLoc.stakeButton)
  }

  get stakeButtonText() {
    return by.text(stakeScreenLoc.stakeButtonText)
  }

  get notEnoughAvaxTitle() {
    return by.text(stakeScreenLoc.notEnoughAvaxTitle)
  }

  get notEnoughAvaxDescription() {
    return by.text(stakeScreenLoc.notEnoughAvaxDescription)
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
    await Assert.isVisible(this.swapAvaxButton)
    await Assert.isVisible(this.recieveAvaxButton)
    await Assert.isVisible(this.buyAvaxButton)
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

  async verifyStakeTopItems() {
    await Assert.isVisible(this.availableAvaxText)
    await Assert.isVisible(this.stakedAvaxText)
    await Assert.isVisible(this.claimableAvaxText)
    await Assert.isVisible(this.stakeButton)
    await Assert.isVisible(this.stakeButtonText, 1)
    await Assert.isVisible(this.avaLogo)
  }
}

export default new StakePage()
