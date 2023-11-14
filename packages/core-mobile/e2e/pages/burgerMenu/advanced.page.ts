import advancedLoc from '../../locators/burgerMenu/advanced.loc'
import Actions from '../../helpers/actions'
import BurgerMenuPage from './burgerMenu.page'

class Advanced {
  get switchButton() {
    return by.id(advancedLoc.switchButton)
  }

  async tapSwitchToTestnetButton() {
    await Actions.tapElementAtIndex(this.switchButton, 0)
  }

  async switchToTestnet() {
    await BurgerMenuPage.tapBurgerMenuButton()
    await BurgerMenuPage.tapAdvanced()
    await Actions.waitForElement(this.switchButton)
    await this.tapSwitchToTestnetButton()
    await BurgerMenuPage.tapBackbutton()
    await BurgerMenuPage.swipeLeft()
  }
}

export default new Advanced()
