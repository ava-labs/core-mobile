import Assert from '../helpers/assertions'
// import Action from '../helpers/actions'
import defi from '../locators/defi.loc'
// import { Platform } from '../helpers/constants'

// const platformIndex = Action.platform() === Platform.iOS ? 1 : 0
// const platformIndex2 = Action.platform() === Platform.iOS ? 0 : 1
class DefiPage {
  get emptyScreenTitle() {
    return by.text(defi.emptyScreenTitle)
  }

  get emptyScreenDescription() {
    return by.text(defi.emptyScreenDescription)
  }

  get exploreButton() {
    return by.id(defi.exploreButton)
  }

  get linkSvg() {
    return by.id(defi.linkSvg)
  }

  async verifyEmptyScreenItems() {
    await Assert.isVisible(this.emptyScreenTitle)
    await Assert.isVisible(this.emptyScreenDescription)
    await Assert.isVisible(this.exploreButton)
    await Assert.isVisible(this.linkSvg)
  }
}

export default new DefiPage()
