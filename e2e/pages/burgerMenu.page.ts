import Actions from '../helpers/actions'
import { Platform } from '../helpers/constants'
import burgerMenu from '../locators/bugerMenu.loc'

// const platformIndex = Actions.platform() === Platform.iOS ? 1 : 0
const platformIndex2 = Actions.platform() === Platform.iOS ? 2 : 0

class BurgerMenuPage {
  get advanced() {
    return by.text(burgerMenu.advanced)
  }

  get backbutton() {
    return by.id(burgerMenu.backbutton)
  }

  get burgerMenuButton() {
    return by.id(burgerMenu.burgerbutton)
  }

  get switchButton() {
    return by.id(burgerMenu.switchButton)
  }

  async tapAdvanced() {
    await Actions.tapElementAtIndex(this.advanced, 0)
  }

  async tapBurgerMenuButton() {
    await Actions.tapElementAtIndex(this.burgerMenuButton, 0)
  }

  async switchToTestnet() {
    await Actions.tapElementAtIndex(this.switchButton, 0)
  }

  async swipeLeft() {
    await Actions.swipeLeft(
      by.id(burgerMenu.carrotSvg),
      'slow',
      0.75,
      platformIndex2
    )
  }

  async tapBackbutton() {
    await Actions.tapElementAtIndex(this.backbutton, 0)
  }
}

export default new BurgerMenuPage()
