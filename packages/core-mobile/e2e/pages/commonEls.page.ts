import commonEls from '../locators/commonEls.loc'
import Actions from '../helpers/actions'
import loginRecoverWallet from '../helpers/loginRecoverWallet'
import advancedPage from './burgerMenu/advanced.page'
import burgerMenuPage from './burgerMenu/burgerMenu.page'

class CommonElsPage {
  get retryBtn() {
    return by.text(commonEls.retryBtn)
  }

  get backButton() {
    return by.id(commonEls.backButton)
  }

  get getStartedButton() {
    return by.text(commonEls.getStartedBtn)
  }

  get inputTextField() {
    return by.id(commonEls.inputTextField)
  }

  get simpleToastMsg() {
    return by.id(commonEls.simpleToastMsg)
  }

  get jailbrokenWarning() {
    return by.id(commonEls.jailbrokenWarning)
  }

  get testnetBanner() {
    return by.id(commonEls.testnetBanner)
  }

  async tapBackButton(index = 0) {
    await Actions.tapElementAtIndex(this.backButton, index)
  }

  async tapGetStartedButton() {
    await Actions.tap(this.getStartedButton)
  }

  async enterTextInput(index: number, inputText: string) {
    await Actions.setInputText(this.inputTextField, inputText, index)
  }

  async waitForToastMsgGone(index?: number) {
    try {
      await Actions.waitForElementNotVisible(this.simpleToastMsg, index)
    } catch (error) {
      console.log('Toast message not found')
    }
  }

  async waitForJailbrokenWarning() {
    await Actions.waitForElement(this.jailbrokenWarning)
  }

  async tapRetryBtn() {
    await Actions.waitForElement(this.retryBtn, 1)
    try {
      await Actions.tap(this.retryBtn)
    } catch (error) {
      /* empty */
    }
  }

  async tapDeviceBackButton() {
    await device.pressBack()
  }

  async checkIfMainnet() {
    if (process.env.SEEDLESS_TEST === 'true') {
      try {
        await Actions.waitForElement(this.testnetBanner, 10000, 0)
        await advancedPage.switchToMainnet()
        await this.tapBackButton()
        await burgerMenuPage.swipeLeft()
        await Actions.swipeLeft(burgerMenuPage.addressBook, 'slow', 1000, 0)
      } catch (error) {
        return
      }
    }
  }

  async refreshApp() {
    if (Actions.platform() === 'ios') {
      await device.reloadReactNative()
    } else {
      await device.launchApp({ newInstance: true })
    }
    loginRecoverWallet.enterPin()
  }
}

export default new CommonElsPage()
