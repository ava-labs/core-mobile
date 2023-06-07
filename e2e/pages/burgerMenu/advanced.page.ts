import advancedLoc from '../../locators/burgerMenu/advanced.loc'
import Actions from '../../helpers/actions'

class Advanced {
  get switchButton() {
    return by.id(advancedLoc.switchButton)
  }

  async switchToTestnet() {
    await Actions.tapElementAtIndex(this.switchButton, 0)
  }
}

export default new Advanced()
