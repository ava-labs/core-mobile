// import Actions from '../../helpers/actions'
import stakeScreenLoc from '../../locators/Stake/stakeScreen.loc'
import Assert from '../../helpers/assertions'

class StakePage {
  get stakeTitle() {
    return by.text(stakeScreenLoc.stakeTitle)
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

  async verifyStakeScreenItems() {
    await Assert.isVisible(this.stakeTitle)
    await Assert.isVisible(this.notEnoughAvaxTitle)
    await Assert.isVisible(this.notEnoughAvaxDescription)
    await Assert.isVisible(this.swapAvaxButton)
    await Assert.isVisible(this.recieveAvaxButton)
    await Assert.isVisible(this.buyAvaxButton)
  }
}

export default new StakePage()
