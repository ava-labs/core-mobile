import Actions from '../../helpers/actions'
import burgerMenu from '../../locators/burgerMenu/bugerMenu.loc'
import { Platform } from '../../helpers/constants'
import commonElsLoc from '../../locators/commonEls.loc'

const platformIndex2 = Actions.platform() === Platform.iOS ? 2 : 0

class BurgerMenuPage {
  get advanced() {
    return by.text(burgerMenu.advanced)
  }

  get addressBook() {
    return by.text(burgerMenu.addressBook)
  }

  get backbutton() {
    return by.id(commonElsLoc.backButton)
  }

  get burgerMenuButton() {
    return by.id(burgerMenu.burgerbutton)
  }

  get securityAndPrivacy() {
    return by.text(burgerMenu.securityAndPrivacy)
  }

  get slideBtn() {
    return by.id(burgerMenu.slideBtn)
  }

  get cancel() {
    return by.id(burgerMenu.cancel)
  }

  async swipeLeft() {
    await Actions.swipeLeft(
      by.id(commonElsLoc.carrotSVG),
      'slow',
      0.5,
      platformIndex2
    )
  }

  async tapAdvanced() {
    await Actions.tapElementAtIndex(this.advanced, 0)
  }

  async tapAddressBook() {
    await Actions.tapElementAtIndex(this.addressBook, 0)
  }

  async tapBurgerMenuButton() {
    await Actions.waitForElement(this.burgerMenuButton)
    await Actions.tapElementAtIndex(this.burgerMenuButton, 0)
  }

  async tapSecurityAndPrivacy() {
    await Actions.tapElementAtIndex(this.securityAndPrivacy, 0)
  }

  async tapBackbutton() {
    await Actions.tapElementAtIndex(this.backbutton, 0)
  }

  async exitBurgerMenu() {
    await this.tapBackbutton()
    await this.swipeLeft()
  }

  async swipeToLogout() {
    if (Actions.platform() === Platform.iOS) {
      await Actions.dragTo(this.slideBtn, this.cancel, [1, 0])
    } else {
      await Actions.drag(this.slideBtn, 'right', 1)
    }
  }
}

export default new BurgerMenuPage()
