import commonEls from '../locators/commonEls.loc'
import Actions from '../helpers/actions'
import loginRecoverWallet from '../helpers/loginRecoverWallet'
import delay from '../helpers/waits'
import advancedPage from './burgerMenu/advanced.page'
import burgerMenuPage from './burgerMenu/burgerMenu.page'

class CommonElsPage {
  get retryBtn() {
    return by.text(commonEls.retryBtn)
  }

  get backButton() {
    return by.id(commonEls.backButton)
  }

  get backSecondaryButton() {
    return by.id(commonEls.backSecondaryButton)
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

  get notNow() {
    return by.text(commonEls.notNow)
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

  async goBack() {
    await delay(1000)
    try {
      await Actions.tapElementAtIndex(this.backButton, 0)
    } catch (e) {
      await Actions.tapElementAtIndex(this.backSecondaryButton, 0)
    }
  }

  async tapNotNow() {
    try {
      await Actions.tapElementAtIndex(this.notNow, 0)
    } catch (e) {
      console.log('Not now button not found')
    }
  }
}

export default new CommonElsPage()
