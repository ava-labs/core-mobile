import advancedLoc from '../../locators/burgerMenu/advanced.loc'
import Actions from '../../helpers/actions'
import commonElsPage from '../commonEls.page'
import Assert from '../../helpers/assertions'
import BurgerMenuPage from './burgerMenu.page'

class Advanced {
  get switchButton() {
    return by.id(advancedLoc.switchButton)
  }

  async tapSwitchToTestnetButton() {
    await Actions.tapElementAtIndex(this.switchButton, 0)
  }

  async switchToTestnet() {
    try {
      await Assert.isVisible(commonElsPage.testnetBanner)
    } catch (error) {
      await BurgerMenuPage.tapBurgerMenuButton()
      await BurgerMenuPage.tapAdvanced()
      await Actions.waitForElement(this.switchButton)
      await this.tapSwitchToTestnetButton()
      await BurgerMenuPage.tapBackbutton()
      await BurgerMenuPage.swipeLeft()
    }
  }

  async switchToMainnet() {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapAdvanced()
    await Actions.waitForElement(this.switchButton)
    await this.tapSwitchToTestnetButton()
  }
}

export default new Advanced()
