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
    const startTime = new Date().getTime()
    await Actions.waitForElement(this.switchButton)
    const endTime = new Date().getTime()
    await Actions.reportUIPerformance(
      startTime,
      endTime,
      'AdvancedScreen',
      1,
      3
    )
    await this.tapSwitchToTestnetButton()
    await BurgerMenuPage.tapBackbutton()
    await BurgerMenuPage.swipeLeft()
  }
}

export default new Advanced()
